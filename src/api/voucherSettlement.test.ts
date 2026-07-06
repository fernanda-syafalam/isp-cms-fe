import { describe, expect, it } from 'vitest'

import { listPayments } from './payments'
import { listResellerLedger, listResellers } from './resellers'
import { generateVoucherBatch, listVouchers, redeemVoucher } from './vouchers'

// Loket voucher settlement (P3.D.3), end-to-end over the MSW layer (server from
// test/setup.ts; resetMockDb runs before each test). Proves a batch can be
// attributed to a mitra, that redeeming a reseller-attributed voucher records a
// payment (source=voucher) plus a commission ledger entry, and that a second
// redeem is idempotent (no double-post).

async function firstReseller(): Promise<{
  id: string
  name: string
  commissionPct: number
}> {
  const { items } = await listResellers()
  const target = items.find((r) => r.commissionPct > 0)
  if (!target) throw new Error('seed has no reseller with commission')
  return {
    id: target.id,
    name: target.name,
    commissionPct: target.commissionPct,
  }
}

async function firstAttributedUnusedVoucher() {
  const { items } = await listVouchers()
  const target = items.find((v) => v.status === 'unused' && v.resellerId)
  if (!target?.resellerId) throw new Error('seed has no reseller-attributed unused voucher')
  return target
}

describe('voucher settlement', () => {
  it('attributes a whole batch to a reseller', async () => {
    const reseller = await firstReseller()
    const profile = `Test Batch ${crypto.randomUUID().slice(0, 8)}`

    const result = await generateVoucherBatch({
      count: 3,
      profile,
      priceIdr: 10_000,
      durationDays: 7,
      resellerId: reseller.id,
    })
    expect(result.created).toBe(3)

    const { items } = await listVouchers({ q: profile })
    const created = items.filter((v) => v.batchId === result.batchId)
    expect(created).toHaveLength(3)
    expect(created.every((v) => v.resellerId === reseller.id)).toBe(true)
    expect(created.every((v) => v.resellerName === reseller.name)).toBe(true)
  })

  it('records a voucher payment + a commission ledger entry on redeem', async () => {
    const voucher = await firstAttributedUnusedVoucher()
    const resellerId = voucher.resellerId
    if (!resellerId) throw new Error('voucher lost its reseller')

    const beforeLedger = await listResellerLedger(resellerId)
    const beforeCommissions = beforeLedger.items.filter((e) => e.type === 'commission').length

    await redeemVoucher(voucher.id)

    // A settlement payment: source=voucher, no invoice/customer, tendered=price.
    const payments = await listPayments()
    const settlement = payments.items.find((p) => p.voucherId === voucher.id)
    expect(settlement).toBeDefined()
    expect(settlement?.source).toBe('voucher')
    expect(settlement?.amount).toBe(voucher.priceIdr)
    expect(settlement?.invoiceId).toBeNull()
    expect(settlement?.customerId).toBeNull()
    expect(settlement?.changeAmount).toBe(0)

    // A commission ledger entry for the attributed mitra.
    const afterLedger = await listResellerLedger(resellerId)
    const afterCommissions = afterLedger.items.filter((e) => e.type === 'commission').length
    expect(afterCommissions).toBe(beforeCommissions + 1)
    const commission = afterLedger.items.find((e) => e.note.includes(voucher.code))
    expect(commission?.type).toBe('commission')
    expect(commission?.amount).toBeGreaterThan(0)
  })

  it('does not double-post the settlement on a second redeem', async () => {
    const voucher = await firstAttributedUnusedVoucher()
    const resellerId = voucher.resellerId
    if (!resellerId) throw new Error('voucher lost its reseller')

    await redeemVoucher(voucher.id)
    const afterFirst = await listResellerLedger(resellerId)
    const paymentsAfterFirst = await listPayments()
    const voucherPaymentsAfterFirst = paymentsAfterFirst.items.filter(
      (p) => p.voucherId === voucher.id,
    ).length

    await redeemVoucher(voucher.id)
    const afterSecond = await listResellerLedger(resellerId)
    const paymentsAfterSecond = await listPayments()
    const voucherPaymentsAfterSecond = paymentsAfterSecond.items.filter(
      (p) => p.voucherId === voucher.id,
    ).length

    expect(afterSecond.items.length).toBe(afterFirst.items.length)
    expect(voucherPaymentsAfterSecond).toBe(voucherPaymentsAfterFirst)
    expect(voucherPaymentsAfterSecond).toBe(1)
  })
})

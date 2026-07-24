import { describe, expect, it } from 'vitest'

import { listPayments } from './payments'
import { listResellerLedger, listResellers } from './resellers'
import { generateVoucherBatch, listVouchers, redeemVoucher } from './vouchers'

// Loket voucher settlement, end-to-end over the MSW layer (server from
// test/setup.ts; resetMockDb runs before each test). Proves a batch can be
// attributed to a mitra, that redeeming a voucher records a payment
// (source=voucher) but posts NO reseller commission (reseller is off day-1,
// ADR-0018), and that a second redeem is idempotent (no double-post).

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

  it('records a voucher payment but posts no reseller commission on redeem', async () => {
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

    // NO reseller commission is posted on redeem (reseller off day-1, ADR-0018):
    // the ledger is unchanged even for a voucher attributed to a mitra.
    const afterLedger = await listResellerLedger(resellerId)
    const afterCommissions = afterLedger.items.filter((e) => e.type === 'commission').length
    expect(afterCommissions).toBe(beforeCommissions)
    expect(afterLedger.items.length).toBe(beforeLedger.items.length)
    expect(afterLedger.items.some((e) => e.note.includes(voucher.code))).toBe(false)
  })

  it('does not double-post the settlement on a second redeem', async () => {
    const voucher = await firstAttributedUnusedVoucher()
    const resellerId = voucher.resellerId
    if (!resellerId) throw new Error('voucher lost its reseller')

    const beforeAny = await listResellerLedger(resellerId)

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

    // No commission either time, so the ledger never grows across both redeems.
    expect(afterFirst.items.length).toBe(beforeAny.items.length)
    expect(afterSecond.items.length).toBe(afterFirst.items.length)
    expect(voucherPaymentsAfterSecond).toBe(voucherPaymentsAfterFirst)
    expect(voucherPaymentsAfterSecond).toBe(1)
  })
})

import { describe, expect, it } from 'vitest'

import { listInvoices, payInvoice } from './invoices'
import { getReconciliation } from './payments'

const today = () => new Date().toISOString().slice(0, 10)

async function firstUnpaidInvoice() {
  const { items } = await listInvoices({ status: 'pending' })
  const invoice = items[0]
  if (!invoice) throw new Error('seed has no pending invoice')
  return invoice
}

describe('payInvoice (partial payments)', () => {
  it('flips an invoice to "partial" then to "paid" as the balance is settled', async () => {
    const invoice = await firstUnpaidInvoice()
    const half = Math.floor(invoice.balanceDue / 2)

    const afterFirst = await payInvoice(invoice.id, {
      method: 'transfer',
      amount: half,
    })
    expect(afterFirst.status).toBe('partial')
    expect(afterFirst.paidAmount).toBe(half)
    expect(afterFirst.balanceDue).toBe(invoice.balanceDue - half)

    const afterSecond = await payInvoice(invoice.id, {
      method: 'transfer',
      amount: afterFirst.balanceDue,
    })
    expect(afterSecond.status).toBe('paid')
    expect(afterSecond.balanceDue).toBe(0)
  })

  it('rejects an overpayment (422)', async () => {
    const invoice = await firstUnpaidInvoice()
    await expect(
      payInvoice(invoice.id, {
        method: 'transfer',
        amount: invoice.balanceDue + 1,
      }),
    ).rejects.toThrow()
  })

  it('rejects a cash payment when tendered is short (400)', async () => {
    const invoice = await firstUnpaidInvoice()
    await expect(
      payInvoice(invoice.id, {
        method: 'cash',
        amount: invoice.balanceDue,
        tenderedAmount: invoice.balanceDue - 1,
      }),
    ).rejects.toThrow()
  })
})

describe('getReconciliation', () => {
  it('derives per-method totals and the cash-drawer summary for the date', async () => {
    const invoice = await firstUnpaidInvoice()
    const amount = invoice.balanceDue
    const tendered = amount + 20_000

    await payInvoice(invoice.id, {
      method: 'cash',
      amount,
      tenderedAmount: tendered,
    })

    const recon = await getReconciliation(today())
    const cashRow = recon.byMethod.find((r) => r.method === 'cash')

    expect(cashRow).toBeDefined()
    expect(cashRow?.count).toBeGreaterThanOrEqual(1)
    expect(recon.totalAmount).toBeGreaterThanOrEqual(amount)
    expect(recon.cash.totalTendered).toBeGreaterThanOrEqual(tendered)
    expect(recon.cash.totalChange).toBeGreaterThanOrEqual(20_000)
  })
})

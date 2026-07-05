import { describe, expect, it } from 'vitest'

import { PaymentReconciliationSchema, PaymentSchema, RecordPaymentSchema } from './payment'

const validPayment = {
  id: '55555555-5555-4555-8555-555555555555',
  invoiceId: '44444444-4444-4444-8444-444444444444',
  invoiceNo: 'INV-2026-100',
  customerId: '11111111-1111-4111-8111-111111111111',
  customerName: 'Budi Santoso',
  amount: 222_000,
  method: 'cash',
  paidAt: '2026-07-06T03:00:00.000Z',
  tenderedAmount: 250_000,
  changeAmount: 28_000,
}

describe('PaymentSchema', () => {
  it('parses a cash payment with tendered + change', () => {
    const parsed = PaymentSchema.parse(validPayment)
    expect(parsed.tenderedAmount).toBe(250_000)
    expect(parsed.changeAmount).toBe(28_000)
  })

  it('accepts null tendered/change for non-cash methods', () => {
    const parsed = PaymentSchema.parse({
      ...validPayment,
      method: 'qris',
      tenderedAmount: null,
      changeAmount: null,
    })
    expect(parsed.tenderedAmount).toBeNull()
    expect(parsed.changeAmount).toBeNull()
  })
})

describe('RecordPaymentSchema', () => {
  it('accepts just a method (full payment)', () => {
    expect(RecordPaymentSchema.parse({ method: 'transfer' }).amount).toBeUndefined()
  })

  it('accepts an optional partial amount + cash tendered', () => {
    const parsed = RecordPaymentSchema.parse({
      method: 'cash',
      amount: 100_000,
      tenderedAmount: 150_000,
    })
    expect(parsed.amount).toBe(100_000)
    expect(parsed.tenderedAmount).toBe(150_000)
  })

  it('rejects a non-positive amount', () => {
    expect(RecordPaymentSchema.safeParse({ method: 'cash', amount: 0 }).success).toBe(false)
  })
})

describe('PaymentReconciliationSchema', () => {
  it('parses a reconciliation payload', () => {
    const parsed = PaymentReconciliationSchema.parse({
      date: '2026-07-06',
      byMethod: [{ method: 'cash', count: 2, totalAmount: 400_000 }],
      totalCount: 2,
      totalAmount: 400_000,
      cash: { totalTendered: 450_000, totalChange: 50_000 },
    })
    expect(parsed.byMethod).toHaveLength(1)
    expect(parsed.cash.totalChange).toBe(50_000)
  })
})

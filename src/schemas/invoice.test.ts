import { describe, expect, it } from 'vitest'

import { InvoiceSchema, InvoiceSummarySchema } from './invoice'

const validInvoice = {
  id: '44444444-4444-4444-8444-444444444444',
  invoiceNo: 'INV-2026-100',
  customerId: '11111111-1111-4111-8111-111111111111',
  customerName: 'Budi Santoso',
  periodStart: '2026-04-01',
  periodEnd: '2026-04-30',
  amount: 200_000,
  lateFee: 0,
  taxAmount: 22_000,
  discountAmount: 0,
  paidAmount: 0,
  balanceDue: 222_000,
  taxInvoiceNo: null,
  status: 'pending',
  dueDate: '2026-05-10',
  paidAt: null,
  lastRemindedAt: null,
  type: 'regular',
  note: null,
}

describe('InvoiceSchema', () => {
  it('parses an invoice carrying the AR fields (paidAmount/discountAmount/balanceDue)', () => {
    const parsed = InvoiceSchema.parse(validInvoice)
    expect(parsed.paidAmount).toBe(0)
    expect(parsed.discountAmount).toBe(0)
    expect(parsed.balanceDue).toBe(222_000)
  })

  it('accepts the new "partial" status', () => {
    const parsed = InvoiceSchema.parse({
      ...validInvoice,
      status: 'partial',
      paidAmount: 100_000,
      balanceDue: 122_000,
    })
    expect(parsed.status).toBe('partial')
    expect(parsed.balanceDue).toBe(122_000)
  })

  it('rejects an invoice missing balanceDue', () => {
    const { balanceDue: _omit, ...withoutBalance } = validInvoice
    expect(InvoiceSchema.safeParse(withoutBalance).success).toBe(false)
  })

  it('rejects an unknown status', () => {
    expect(InvoiceSchema.safeParse({ ...validInvoice, status: 'void' }).success).toBe(false)
  })

  it('parses an adjustment invoice carrying a proration note', () => {
    const parsed = InvoiceSchema.parse({
      ...validInvoice,
      type: 'adjustment',
      note: 'Proration: Home 20 → Home 50',
    })
    expect(parsed.type).toBe('adjustment')
    expect(parsed.note).toBe('Proration: Home 20 → Home 50')
  })

  it('rejects an unknown invoice type', () => {
    expect(InvoiceSchema.safeParse({ ...validInvoice, type: 'credit' }).success).toBe(false)
  })
})

describe('InvoiceSummarySchema', () => {
  it('requires a partial count in byStatus', () => {
    const summary = {
      outstanding: 222_000,
      overdue: 0,
      unpaidCount: 1,
      total: 3,
      byStatus: { paid: 1, partial: 1, pending: 1, overdue: 0, draft: 0 },
    }
    expect(InvoiceSummarySchema.parse(summary).byStatus.partial).toBe(1)

    const { partial: _omit, ...withoutPartial } = summary.byStatus
    expect(InvoiceSummarySchema.safeParse({ ...summary, byStatus: withoutPartial }).success).toBe(
      false,
    )
  })
})

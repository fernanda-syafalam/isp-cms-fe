import { describe, expect, it } from 'vitest'

import { PortalMeSchema } from './portal'

const CUSTOMER_ID = '11111111-1111-4111-8111-111111111111'
const INVOICE_ID = '33333333-3333-4333-8333-333333333333'

const customer = {
  id: CUSTOMER_ID,
  customerNo: 'CUST-1001',
  fullName: 'Budi Santoso',
  phone: '081200000001',
  email: 'budi@example.com',
  address: 'Jl. Pemuda No. 1, Jepara',
  areaId: null,
  areaName: 'Jepara',
  planId: '22222222-2222-4222-8222-222222222222',
  planName: 'Home 20',
  status: 'aktif',
  holdReason: null,
  outstanding: 250_000,
  billingAnchorDay: null,
  npwp: null,
  ktp: null,
  consentAt: null,
  resellerName: null,
  connection: null,
  joinedAt: '2025-01-01T00:00:00.000Z',
}

const invoice = {
  id: INVOICE_ID,
  invoiceNo: 'INV-2026-0001',
  customerId: CUSTOMER_ID,
  customerName: 'Budi Santoso',
  periodStart: '2026-05-01',
  periodEnd: '2026-05-31',
  amount: 250_000,
  lateFee: 0,
  taxAmount: 0,
  discountAmount: 0,
  paidAmount: 0,
  balanceDue: 250_000,
  taxInvoiceNo: null,
  status: 'overdue',
  dueDate: '2026-06-01',
  paidAt: null,
  lastRemindedAt: null,
}

const pendingIntent = {
  id: 'intent-abc-123',
  invoiceId: INVOICE_ID,
  invoiceNo: 'INV-2026-0001',
  customerName: 'Budi Santoso',
  amount: 250_000,
  channel: 'qris',
  status: 'pending',
  vaNumber: null,
  qrPayload: '00020101021226ID',
  createdAt: '2026-07-05T00:00:00.000Z',
  expiresAt: '2026-07-06T00:00:00.000Z',
  paidAt: null,
}

describe('PortalMeSchema', () => {
  it('parses a snapshot carrying pendingIntents (ADR-0011 parity)', () => {
    const parsed = PortalMeSchema.parse({
      customer,
      invoices: [invoice],
      payments: [],
      tickets: [],
      pendingIntents: [pendingIntent],
    })
    expect(parsed.pendingIntents).toHaveLength(1)
    expect(parsed.pendingIntents[0]?.invoiceId).toBe(INVOICE_ID)
    expect(parsed.pendingIntents[0]?.status).toBe('pending')
  })

  it('requires pendingIntents to be present', () => {
    const result = PortalMeSchema.safeParse({
      customer,
      invoices: [invoice],
      payments: [],
      tickets: [],
    })
    expect(result.success).toBe(false)
  })
})

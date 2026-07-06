import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { renderWithRouter } from '@/test/helpers'
import { server } from '@/test/msw/server'

import { CustomerPortalPage } from './CustomerPortalPage'
import { PortalInvoicePrintPage } from './PortalInvoicePrintPage'

const CUSTOMER_ID = '11111111-1111-4111-8111-111111111111'
const PLAN_ID = '22222222-2222-4222-8222-222222222222'
const INVOICE_ID = '33333333-3333-4333-8333-333333333333'
const QR_PAYLOAD = '00020101021226RESUMEME5204ID'

function buildMe(options: { withIntent: boolean; invoiceStatus?: 'overdue' | 'paid' }) {
  const invoiceStatus = options.invoiceStatus ?? 'overdue'
  const customer = {
    id: CUSTOMER_ID,
    customerNo: 'CUST-1001',
    fullName: 'Budi Santoso',
    phone: '081200000001',
    email: 'budi@example.com',
    address: 'Jl. Pemuda No. 1, Jepara',
    areaId: null,
    areaName: 'Jepara',
    planId: PLAN_ID,
    planName: 'Home 20',
    status: 'aktif' as const,
    holdReason: null,
    outstanding: invoiceStatus === 'paid' ? 0 : 250_000,
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
    customerName: customer.fullName,
    periodStart: '2026-05-01',
    periodEnd: '2026-05-31',
    amount: 250_000,
    lateFee: 0,
    taxAmount: 0,
    discountAmount: 0,
    paidAmount: invoiceStatus === 'paid' ? 250_000 : 0,
    balanceDue: invoiceStatus === 'paid' ? 0 : 250_000,
    taxInvoiceNo: null,
    status: invoiceStatus,
    dueDate: '2026-06-01',
    paidAt: invoiceStatus === 'paid' ? '2026-06-02T00:00:00.000Z' : null,
    lastRemindedAt: null,
  }
  const pendingIntents = options.withIntent
    ? [
        {
          id: 'intent-resume-1',
          invoiceId: INVOICE_ID,
          invoiceNo: 'INV-2026-0001',
          customerName: customer.fullName,
          amount: 250_000,
          channel: 'qris' as const,
          status: 'pending' as const,
          vaNumber: null,
          qrPayload: QR_PAYLOAD,
          createdAt: '2026-07-05T00:00:00.000Z',
          expiresAt: '2026-12-31T00:00:00.000Z',
          paidAt: null,
        },
      ]
    : []
  return {
    customer,
    invoices: [invoice],
    payments: [],
    tickets: [],
    pendingIntents,
  }
}

function mockMe(options: { withIntent: boolean; invoiceStatus?: 'overdue' | 'paid' }) {
  server.use(http.get('*/api/portal/me', () => HttpResponse.json(buildMe(options))))
}

describe('portal billing artifacts (P3.C.3)', () => {
  it('resumes a pending QRIS/VA intent from the portal invoice list', async () => {
    mockMe({ withIntent: true })
    renderWithRouter(<CustomerPortalPage />)

    // The waiting-for-payment affordance surfaces for the invoice with an intent.
    expect(await screen.findByText(/Menunggu pembayaran \(QRIS\/VA\)/i)).toBeInTheDocument()

    // Resume from the prominent card (no channel picker — jumps to the VA/QR view).
    const resume = screen.getByRole('button', {
      name: /Lanjutkan pembayaran/i,
    })
    await userEvent.click(resume)

    expect(await screen.findByText(/Lanjutkan pembayaran yang tertunda/i)).toBeInTheDocument()
    // The seeded intent's QRIS payload renders — the resume view, not the picker.
    expect(screen.getByText(QR_PAYLOAD)).toBeInTheDocument()
    expect(screen.queryByLabelText('Metode pembayaran')).toBeNull()
  })

  it('renders the printable invoice + a print button from the cached portal snapshot', async () => {
    mockMe({ withIntent: false, invoiceStatus: 'paid' })
    renderWithRouter(<PortalInvoicePrintPage invoiceId={INVOICE_ID} />, {
      initialPath: `/portal/invoices/${INVOICE_ID}/print`,
    })

    // A paid invoice prints as a KWITANSI (receipt).
    expect(await screen.findByText('KWITANSI')).toBeInTheDocument()
    expect(screen.getByText('INV-2026-0001')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Unduh \/ Cetak/i })).toBeInTheDocument()
  })
})

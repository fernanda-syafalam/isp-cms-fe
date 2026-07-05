import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { formatDate } from '@/lib/format'
import type { CustomerStatus } from '@/schemas/customer'
import { renderWithProviders } from '@/test/helpers'
import { server } from '@/test/msw/server'

import { CustomerPortalPage } from './CustomerPortalPage'

const CUSTOMER_ID = '11111111-1111-4111-8111-111111111111'
const PLAN_ID = '22222222-2222-4222-8222-222222222222'
const INVOICE_ID = '33333333-3333-4333-8333-333333333333'

const OUTSTANDING = 250_000
const DUE_DATE = '2026-06-01'

type MeOptions = {
  status: CustomerStatus
  holdReason: 'overdue' | 'voluntary' | null
  withUnpaid?: boolean
}

// Build a full portal/me payload the real getPortalMe can Zod-parse, so the
// component sees a realistic snapshot without touching the shared fixtures.
function buildMe({ status, holdReason, withUnpaid = true }: MeOptions) {
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
    status,
    holdReason,
    outstanding: withUnpaid ? OUTSTANDING : 0,
    billingAnchorDay: null,
    npwp: null,
    ktp: null,
    consentAt: null,
    resellerName: null,
    connection: null,
    joinedAt: '2025-01-01T00:00:00.000Z',
  }
  const invoices = withUnpaid
    ? [
        {
          id: INVOICE_ID,
          invoiceNo: 'INV-2026-0001',
          customerId: CUSTOMER_ID,
          customerName: customer.fullName,
          periodStart: '2026-05-01',
          periodEnd: '2026-05-31',
          amount: OUTSTANDING,
          lateFee: 0,
          taxAmount: 0,
          discountAmount: 0,
          paidAmount: 0,
          balanceDue: OUTSTANDING,
          taxInvoiceNo: null,
          status: 'overdue' as const,
          dueDate: DUE_DATE,
          paidAt: null,
          lastRemindedAt: null,
        },
      ]
    : []
  return { customer, invoices, payments: [], tickets: [] }
}

function mockMe(options: MeOptions) {
  server.use(http.get('*/api/portal/me', () => HttpResponse.json(buildMe(options))))
}

describe('IsolirWalledGarden (via CustomerPortalPage)', () => {
  it('shows the pay-to-reactivate walled garden for an overdue isolir subscriber', async () => {
    mockMe({ status: 'isolir', holdReason: 'overdue' })
    renderWithProviders(<CustomerPortalPage />)

    // Punitive headline is announced to assistive tech.
    const heading = await screen.findByRole('heading', {
      name: /diisolir karena tagihan belum dibayar/i,
    })
    expect(heading.closest('[role="alert"]')).not.toBeNull()

    // Outstanding total + oldest-unpaid due date are surfaced. Match on the
    // grouped digits — the IDR formatter uses a non-breaking space the default
    // normalizer collapses, so an exact-string match would miss.
    expect(screen.getAllByText(/250\.000/).length).toBeGreaterThan(0)
    expect(screen.getByText(`Jatuh tempo paling awal ${formatDate(DUE_DATE)}`)).toBeInTheDocument()

    // The normal dashboard chrome must NOT render.
    expect(screen.queryByText('Status layanan')).toBeNull()
    expect(screen.queryByText('Riwayat pembayaran')).toBeNull()

    // The primary CTA opens the shared checkout dialog.
    const payButton = screen.getByRole('button', { name: /bayar sekarang/i })
    await userEvent.click(payButton)
    expect(await screen.findByText('Bayar online')).toBeInTheDocument()
  })

  it('shows a non-punitive paused message for a voluntary (cuti) hold', async () => {
    mockMe({ status: 'isolir', holdReason: 'voluntary' })
    renderWithProviders(<CustomerPortalPage />)

    const heading = await screen.findByRole('heading', {
      name: /dijeda atas permintaan Anda/i,
    })
    expect(heading.closest('[role="alert"]')).not.toBeNull()
    expect(screen.getByText(/hubungi tim dukungan kami/i)).toBeInTheDocument()

    // No pay-to-unblock framing for a voluntary pause.
    expect(screen.queryByRole('button', { name: /bayar sekarang/i })).toBeNull()
    expect(screen.queryByText('Status layanan')).toBeNull()
  })

  it('renders the normal dashboard for an active subscriber (regression)', async () => {
    mockMe({ status: 'aktif', holdReason: null })
    renderWithProviders(<CustomerPortalPage />)

    await waitFor(() => {
      expect(screen.getByText('Status layanan')).toBeInTheDocument()
    })
    expect(screen.getByText('Riwayat pembayaran')).toBeInTheDocument()
    // Neither walled-garden headline is present.
    expect(screen.queryByText(/diisolir karena tagihan/i)).toBeNull()
    expect(screen.queryByText(/dijeda atas permintaan Anda/i)).toBeNull()
  })
})

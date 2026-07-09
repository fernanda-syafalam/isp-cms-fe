import { screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/helpers'
import { server } from '@/test/msw/server'

import { InvoiceDetailPage } from './InvoiceDetailPage'

// Stub the router Link + the action cluster so the page renders without a full
// router stack; the test targets the money breakdown only.
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}))
vi.mock('./InvoicePageActions', () => ({
  RemindButton: () => null,
  OnlinePayButton: () => null,
  PayMenu: () => null,
}))

const INVOICE_ID = 'b1b1b1b1-1111-4111-8111-000000000001'

// A discounted, partially-paid invoice: gross = 100k + 11k PPN = 111k;
// balanceDue = 111k − 20k discount − 30k paid = 61k.
const DISCOUNTED_INVOICE = {
  id: INVOICE_ID,
  invoiceNo: 'INV-2026-0001',
  customerId: 'aaaaaaaa-1111-4111-8111-000000000001',
  customerName: 'Pelanggan Uji',
  periodStart: '2026-06-01',
  periodEnd: '2026-06-30',
  amount: 100_000,
  lateFee: 0,
  taxAmount: 11_000,
  discountAmount: 20_000,
  paidAmount: 30_000,
  balanceDue: 61_000,
  taxInvoiceNo: null,
  status: 'partial',
  dueDate: '2026-07-10',
  paidAt: null,
  lastRemindedAt: null,
  type: 'regular',
  note: null,
}

describe('InvoiceDetailPage', () => {
  it('shows discount, paid, and balanceDue with the owed headline net of credits', async () => {
    server.use(http.get('*/api/invoices/:id', () => HttpResponse.json(DISCOUNTED_INVOICE)))

    renderWithProviders(<InvoiceDetailPage invoiceId={INVOICE_ID} />)

    await waitFor(() => {
      expect(screen.getByText('Diskon')).toBeInTheDocument()
    })

    // Credit + payment rows are visible (previously invisible on this page):
    // two negative "− Rp" money lines (discount + paid).
    expect(screen.getAllByText(/-\s*Rp/)).toHaveLength(2)
    expect(screen.getByText('Sudah dibayar')).toBeInTheDocument()
    expect(screen.getByText(/20\.000/)).toBeInTheDocument()
    expect(screen.getByText(/30\.000/)).toBeInTheDocument()

    // Gross total is still shown as a line item…
    const grossRow = screen.getByText('Total tagihan').parentElement
    expect(grossRow).toHaveTextContent('111.000')

    // …but the headline "amount owed" is balanceDue (net), not the gross total.
    const owedRow = screen.getByText('Sisa tagihan').parentElement
    expect(owedRow).toHaveTextContent('61.000')
    expect(owedRow).not.toHaveTextContent('111.000')
  })

  it('omits discount/paid rows when there is no credit or payment', async () => {
    server.use(
      http.get('*/api/invoices/:id', () =>
        HttpResponse.json({
          ...DISCOUNTED_INVOICE,
          discountAmount: 0,
          paidAmount: 0,
          balanceDue: 111_000,
          status: 'pending',
        }),
      ),
    )

    renderWithProviders(<InvoiceDetailPage invoiceId={INVOICE_ID} />)

    await waitFor(() => {
      expect(screen.getByText('Total tagihan')).toBeInTheDocument()
    })
    expect(screen.queryByText('Diskon')).toBeNull()
    expect(screen.queryByText('Sudah dibayar')).toBeNull()
    const owedRow = screen.getByText('Sisa tagihan').parentElement
    expect(owedRow).toHaveTextContent('111.000')
  })

  it('shows the "Penyesuaian" badge and the note for an adjustment invoice', async () => {
    server.use(
      http.get('*/api/invoices/:id', () =>
        HttpResponse.json({
          ...DISCOUNTED_INVOICE,
          type: 'adjustment',
          note: 'Proration: Home 20 → Home 50',
        }),
      ),
    )

    renderWithProviders(<InvoiceDetailPage invoiceId={INVOICE_ID} />)

    await waitFor(() => {
      expect(screen.getByText('Penyesuaian')).toBeInTheDocument()
    })
    expect(screen.getByText('Catatan penyesuaian')).toBeInTheDocument()
    expect(screen.getByText('Proration: Home 20 → Home 50')).toBeInTheDocument()
  })

  it('omits the badge and note for a regular invoice', async () => {
    server.use(http.get('*/api/invoices/:id', () => HttpResponse.json(DISCOUNTED_INVOICE)))

    renderWithProviders(<InvoiceDetailPage invoiceId={INVOICE_ID} />)

    await waitFor(() => {
      expect(screen.getByText('Total tagihan')).toBeInTheDocument()
    })
    expect(screen.queryByText('Penyesuaian')).toBeNull()
    expect(screen.queryByText('Catatan penyesuaian')).toBeNull()
  })
})

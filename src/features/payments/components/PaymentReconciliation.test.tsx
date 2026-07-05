import { screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/helpers'
import { server } from '@/test/msw/server'

import { PaymentReconciliation } from './PaymentReconciliation'

const today = new Date().toISOString().slice(0, 10)

describe('PaymentReconciliation', () => {
  it('renders the per-method table and the cash-drawer summary', async () => {
    server.use(
      http.get('*/api/payments/reconciliation', () =>
        HttpResponse.json({
          date: today,
          byMethod: [
            { method: 'cash', count: 3, totalAmount: 660_000 },
            { method: 'qris', count: 1, totalAmount: 222_000 },
          ],
          totalCount: 4,
          totalAmount: 882_000,
          cash: { totalTendered: 700_000, totalChange: 40_000 },
        }),
      ),
    )

    renderWithProviders(<PaymentReconciliation />)

    await waitFor(() => {
      expect(screen.getByText('Tunai')).toBeInTheDocument()
    })
    // Per-method row totals (currency uses a non-breaking space after "Rp").
    expect(screen.getByText('QRIS')).toBeInTheDocument()
    expect(screen.getByText(/660\.000/)).toBeInTheDocument()
    // Cash-drawer KPI values (uang diterima / kembalian).
    expect(screen.getByText(/700\.000/)).toBeInTheDocument()
    expect(screen.getByText(/40\.000/)).toBeInTheDocument()
  })

  it('shows an empty state when no payments were recorded that day', async () => {
    server.use(
      http.get('*/api/payments/reconciliation', () =>
        HttpResponse.json({
          date: today,
          byMethod: [],
          totalCount: 0,
          totalAmount: 0,
          cash: { totalTendered: 0, totalChange: 0 },
        }),
      ),
    )

    renderWithProviders(<PaymentReconciliation />)

    await waitFor(() => {
      expect(screen.getByText(/belum ada pembayaran pada tanggal ini/i)).toBeInTheDocument()
    })
  })

  it('shows an error state when the reconciliation query fails', async () => {
    server.use(
      http.get('*/api/payments/reconciliation', () => new HttpResponse(null, { status: 500 })),
    )

    renderWithProviders(<PaymentReconciliation />)

    await waitFor(() => {
      expect(screen.getByText(/gagal memuat rekonsiliasi/i)).toBeInTheDocument()
    })
  })
})

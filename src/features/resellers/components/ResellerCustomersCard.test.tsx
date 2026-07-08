import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/helpers'
import { server } from '@/test/msw/server'

import { ResellerCustomersCard } from './ResellerCustomersCard'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}))
// The role only picks which detail link to render; pin it so the card renders
// without an auth store.
vi.mock('@/features/auth', () => ({ useEffectiveRole: () => 'admin' }))

const RESELLER_ID = 'a3a3a3a3-1111-4111-8111-000000000000'
// More than one page (page size 20) and more than the BE's default 50-row cap,
// so a naive un-paged roster would silently truncate.
const ROSTER_TOTAL = 63

function makeRosterCustomer(i: number) {
  return {
    id: `cccccccc-1111-4111-8111-${String(i).padStart(12, '0')}`,
    customerNo: `CUST-${9000 + i}`,
    fullName: `Pelanggan Roster ${i}`,
    phone: '08120000000',
    email: null,
    address: 'Jl. Uji No. 1',
    areaId: null,
    areaName: null,
    planId: 'dddddddd-1111-4111-8111-000000000001',
    planName: 'Paket Uji',
    status: 'aktif',
    holdReason: null,
    outstanding: 0,
    billingAnchorDay: null,
    consentAt: null,
    resellerName: 'Loket Andi',
    connection: null,
    joinedAt: '2026-01-01T00:00:00.000Z',
  }
}

// Server-side paging mock: honours limit/offset and reports the full `total`.
function seedRoster(total: number) {
  const all = Array.from({ length: total }, (_, i) => makeRosterCustomer(i))
  server.use(
    http.get('*/api/customers', ({ request }) => {
      const url = new URL(request.url)
      const limit = Number(url.searchParams.get('limit') ?? String(total))
      const offset = Number(url.searchParams.get('offset') ?? '0')
      return HttpResponse.json({
        items: all.slice(offset, offset + limit),
        total,
        summary: {
          total,
          outstanding: 0,
          byStatus: { prospek: 0, instalasi: 0, aktif: total, isolir: 0, berhenti: 0 },
        },
      })
    }),
  )
}

describe('ResellerCustomersCard', () => {
  it('shows the true total for a reseller with more than one page (not truncated)', async () => {
    seedRoster(ROSTER_TOTAL)
    renderWithProviders(<ResellerCustomersCard resellerId={RESELLER_ID} />)

    // Header count is the full roster size, even though only a page is shown.
    await waitFor(() => {
      expect(screen.getByText(/Pelanggan reseller \(63\)/)).toBeInTheDocument()
    })
    // First page only: row 0 is present, row 25 (page 2) is not.
    expect(screen.getByText('Pelanggan Roster 0')).toBeInTheDocument()
    expect(screen.queryByText('Pelanggan Roster 25')).toBeNull()
    expect(screen.getByText(/Menampilkan 1–20 dari 63/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sebelumnya' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Berikutnya' })).toBeEnabled()
  })

  it('pages through the roster server-side', async () => {
    seedRoster(ROSTER_TOTAL)
    renderWithProviders(<ResellerCustomersCard resellerId={RESELLER_ID} />)

    await waitFor(() => {
      expect(screen.getByText('Pelanggan Roster 0')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: 'Berikutnya' }))

    await waitFor(() => {
      expect(screen.getByText('Pelanggan Roster 20')).toBeInTheDocument()
    })
    expect(screen.getByText(/Menampilkan 21–40 dari 63/)).toBeInTheDocument()
    expect(screen.queryByText('Pelanggan Roster 0')).toBeNull()
  })
})

import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/helpers'
import { server } from '@/test/msw/server'

import { UsageQuotaCard } from './UsageQuotaCard'

const USAGE = {
  customerId: '00000000-0000-4000-8000-000000000001',
  customerName: 'Budi Santoso',
  planName: 'Home 20',
  quotaGb: 500,
  usedGb: 220,
  fupThrottled: false,
  trend: [10, 20, 15, 30, 25, 40, 35],
}

describe('UsageQuotaCard', () => {
  it('renders the quota usage figures', async () => {
    server.use(http.get('*/api/portal/usage', () => HttpResponse.json(USAGE)))

    renderWithProviders(<UsageQuotaCard />)

    expect(await screen.findByText(/220 GB/)).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '44')
    expect(screen.getByText('Normal')).toBeInTheDocument()
  })

  it('shows the FUP badge when throttled', async () => {
    server.use(
      http.get('*/api/portal/usage', () =>
        HttpResponse.json({ ...USAGE, usedGb: 500, fupThrottled: true }),
      ),
    )

    renderWithProviders(<UsageQuotaCard />)

    expect(await screen.findByText('FUP (dibatasi)')).toBeInTheDocument()
  })

  it('shows an error state when the request fails', async () => {
    server.use(
      http.get('*/api/portal/usage', () => HttpResponse.json({ message: 'boom' }, { status: 500 })),
    )

    renderWithProviders(<UsageQuotaCard />)

    expect(await screen.findByText('Gagal memuat data pemakaian.')).toBeInTheDocument()
  })
})

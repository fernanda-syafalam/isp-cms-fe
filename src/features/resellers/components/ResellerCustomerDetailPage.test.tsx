import { screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/helpers'

import { ResellerCustomerDetailPage } from './ResellerCustomerDetailPage'

// Stub the router Link so the page renders without a full router stack.
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}))

// Seed fixtures (see src/test/msw/handlers.ts): reseller 0 is "Loket Andi",
// whose own customers are every 5th (i % 5 === 0). Customer i=5 belongs to it;
// customer i=2 belongs to "Agen Budi" — outside this reseller's scope.
const RESELLER_ID = 'a3a3a3a3-1111-4111-8111-000000000000'
const OWN_CUSTOMER_ID = 'aaaaaaaa-1111-4111-8111-000000000005'
const OTHER_CUSTOMER_ID = 'aaaaaaaa-1111-4111-8111-000000000002'

describe('ResellerCustomerDetailPage', () => {
  it("renders a reseller's own customer read-only", async () => {
    renderWithProviders(
      <ResellerCustomerDetailPage resellerId={RESELLER_ID} customerId={OWN_CUSTOMER_ID} />,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Pelanggan F5' })).toBeInTheDocument()
    })
    expect(screen.getByText('CUST-1006')).toBeInTheDocument()
    expect(screen.getByText('Data pelanggan')).toBeInTheDocument()
    // Read-only: no edit/billing/network actions on the page.
    expect(screen.queryByRole('button', { name: /Ubah|Simpan|Tagih|Isolir/ })).toBeNull()
  })

  it('renders not-found for a customer outside the reseller (scope enforced)', async () => {
    renderWithProviders(
      <ResellerCustomerDetailPage resellerId={RESELLER_ID} customerId={OTHER_CUSTOMER_ID} />,
    )

    await waitFor(() => {
      expect(screen.getByText('Pelanggan tidak ditemukan.')).toBeInTheDocument()
    })
  })
})

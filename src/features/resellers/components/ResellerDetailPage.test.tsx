import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/helpers'
import { server } from '@/test/msw/server'

import { ResellerDetailPage } from './ResellerDetailPage'

// Stub the router Link so the page (BackLink + KpiCard links) renders without a
// full router stack.
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}))

// Pin the effective role to `mitra` (a partner viewing their own storefront) and
// deny the manage permission — this is exactly what a real mitra session yields.
vi.mock('@/features/auth', () => ({
  useCan: () => false,
  useEffectiveRole: () => 'mitra',
}))

// Toasts are surfaced via sonner; spy on it so we can assert the 422 message.
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

// Seeded storefront: reseller 0 is "Loket Andi" (see src/test/msw/handlers.ts,
// RESELLER_FIXTURES[0]).
const RESELLER_ID = 'a3a3a3a3-1111-4111-8111-000000000000'

describe('ResellerDetailPage (mitra self-service)', () => {
  it('shows the request-payout button but hides admin-only and payout-lifecycle controls', async () => {
    renderWithProviders(<ResellerDetailPage resellerId={RESELLER_ID} />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Loket Andi' })).toBeInTheDocument()
    })

    // The request action is available to a mitra…
    expect(screen.getByRole('button', { name: 'Ajukan pencairan' })).toBeInTheDocument()

    // …but the admin/staff-only balance controls are not.
    expect(screen.queryByRole('button', { name: 'Top-up' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Catat komisi' })).toBeNull()

    // …and neither are the payout-lifecycle controls (approve/reject/disburse),
    // even though the seeded storefront has an open `requested` payout.
    expect(screen.queryByRole('button', { name: 'Setujui' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Tolak' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Cairkan' })).toBeNull()
  })

  it('submits the request to POST /resellers/:id/payouts and surfaces a 422 as a toast', async () => {
    let capturedId: string | undefined
    let capturedAmount: number | undefined
    server.use(
      http.post('*/api/resellers/:id/payouts', async ({ params, request }) => {
        capturedId = String(params.id)
        capturedAmount = ((await request.json()) as { amount: number }).amount
        return new HttpResponse(
          JSON.stringify({ message: 'Saldo tidak mencukupi untuk pencairan.' }),
          { status: 422 },
        )
      }),
    )

    renderWithProviders(<ResellerDetailPage resellerId={RESELLER_ID} />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Loket Andi' })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: 'Ajukan pencairan' }))

    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Jumlah (Rp)'), '999999999')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Ajukan pencairan' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Saldo tidak mencukupi untuk pencairan.')
    })
    // The request hit the mitra's own storefront id.
    expect(capturedId).toBe(RESELLER_ID)
    expect(capturedAmount).toBeGreaterThan(0)
  })
})

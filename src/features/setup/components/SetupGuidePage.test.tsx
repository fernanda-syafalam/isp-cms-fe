import { screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/helpers'
import { server } from '@/test/msw/server'

import { SetupGuidePage } from './SetupGuidePage'

// Stub the router Link so the page renders without a full router stack.
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: { to: string; children: ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}))

// A payload where the network step (2) is the first incomplete one, so the page
// must surface it as the next action.
const PARTIAL_STATUS = {
  catalogue: { done: true, plansCount: 3 },
  network: { done: false, routersCount: 1, profilesCount: 0, poolsCount: 0 },
  branches: { done: false, branchesCount: 0 },
  settings: { done: false, companyName: '' },
  staff: { done: false, staffCount: 0 },
  onboarding: { done: false, instalasiCount: 0, aktifCount: 0 },
  workOrders: { done: false, installDoneCount: 0 },
  active: { done: false, activeCount: 0 },
}

describe('SetupGuidePage', () => {
  it('marks every step done when the server reports full setup', async () => {
    renderWithProviders(<SetupGuidePage />)

    await waitFor(() => {
      expect(screen.getByText(/Setup selesai/)).toBeInTheDocument()
    })
    // All eight steps read "Selesai" and none is flagged as next.
    expect(screen.getAllByText('Selesai')).toHaveLength(8)
    expect(screen.queryByText('Berikutnya')).toBeNull()
  })

  it('highlights the first incomplete step as the next action', async () => {
    server.use(http.get('*/api/setup/status', () => HttpResponse.json(PARTIAL_STATUS)))

    renderWithProviders(<SetupGuidePage />)

    await waitFor(() => {
      expect(screen.getByText('1 dari 8 langkah selesai')).toBeInTheDocument()
    })
    // Network is the first not-done step → surfaced as "Berikutnya" + honest count.
    expect(screen.getByText('Berikutnya')).toBeInTheDocument()
    expect(screen.getByText(/Berikutnya: Siapkan jaringan/)).toBeInTheDocument()
    expect(screen.getByText('1 router, 0 profil, 0 pool')).toBeInTheDocument()
  })

  it('shows an error state when the status query fails', async () => {
    server.use(http.get('*/api/setup/status', () => new HttpResponse(null, { status: 500 })))

    renderWithProviders(<SetupGuidePage />)

    await waitFor(() => {
      expect(screen.getByText(/Tidak bisa memuat status setup/)).toBeInTheDocument()
    })
  })
})

import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/helpers'

import { useRevokeOtherSessions, useRevokeSession, useSecurity } from '../hooks/useSecurity'
import { SecuritySessionsCard } from './SecuritySessionsCard'

// Wire the presentational card to the real query/mutation hooks so the test
// exercises the full path: GET /security -> render -> revoke -> invalidate ->
// refetch. MSW backs the network (three sessions, one current).
function Harness() {
  const { data, isLoading } = useSecurity()
  const revoke = useRevokeSession()
  const revokeOthers = useRevokeOtherSessions()
  return (
    <SecuritySessionsCard
      data={data}
      isLoading={isLoading}
      revoke={revoke}
      revokeOthers={revokeOthers}
    />
  )
}

describe('SecuritySessionsCard', () => {
  it('renders the session list from the query and marks the current session', async () => {
    renderWithProviders(<Harness />)

    // The list renders once the query resolves — the raw User-Agent from the
    // backend is humanized to a friendly "Browser · OS" label.
    await screen.findByText('Chrome · macOS')
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByText('Safari · iOS')).toBeInTheDocument()
    expect(screen.getByText('Edge · Windows')).toBeInTheDocument()

    // The current session carries the "Sesi ini" badge and exposes no revoke
    // control (you cannot end the session you are using).
    const current = screen.getByText('Chrome · macOS').closest('li')
    expect(current).not.toBeNull()
    const currentRow = within(current as HTMLElement)
    expect(currentRow.getByText('Sesi ini')).toBeInTheDocument()
    expect(currentRow.queryByRole('button', { name: /akhiri sesi/i })).toBeNull()

    // Every other session gets a per-row "Akhiri sesi" button.
    expect(screen.getAllByRole('button', { name: /akhiri sesi/i })).toHaveLength(2)
  })

  it('ends all other sessions and refreshes the list, keeping only the current one', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<Harness />)

    await screen.findByText('Safari · iOS')

    await user.click(screen.getByRole('button', { name: 'Akhiri semua sesi lain' }))

    // After the mutation invalidates and the query refetches, only the current
    // session survives and the bulk action disappears (nothing left to end).
    await waitFor(() => {
      expect(screen.queryByText('Safari · iOS')).not.toBeInTheDocument()
    })
    expect(screen.queryByText('Edge · Windows')).not.toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('Chrome · macOS')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Akhiri semua sesi lain' })).not.toBeInTheDocument()
  })
})

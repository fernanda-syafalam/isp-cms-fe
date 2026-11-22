import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { toast } from 'sonner'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/helpers'
import { server } from '@/test/msw/server'

import { PayoutsCard } from './PayoutsCard'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const RESELLER_ID = 'a3a3a3a3-1111-4111-8111-000000000000'

function payout(id: string, status: 'requested' | 'approved') {
  return {
    id,
    resellerId: RESELLER_ID,
    amount: 250_000,
    status,
    note: '',
    requestedBy: null,
    decidedBy: null,
    ledgerEntryId: null,
    createdAt: '2026-03-20T00:00:00.000Z',
    updatedAt: '2026-03-20T00:00:00.000Z',
    decidedAt: null,
  }
}

const REQUESTED_ID = 'a4a4a4a4-1111-4111-8111-000000000001'
const APPROVED_ID = 'a4a4a4a4-1111-4111-8111-000000000002'

function mockPayouts(status: 'requested' | 'approved', id: string) {
  const posts: string[] = []
  server.use(
    http.get('*/api/resellers/:id/payouts', () =>
      HttpResponse.json({ items: [payout(id, status)], total: 1 }),
    ),
    http.post('*/api/resellers/:id/payouts/:payoutId/:action', ({ params }) => {
      posts.push(String(params.action))
      return HttpResponse.json(payout(id, status))
    }),
  )
  return posts
}

function renderCard() {
  renderWithProviders(<PayoutsCard resellerId={RESELLER_ID} resellerName="Loket Andi" canManage />)
}

describe('PayoutsCard confirmation', () => {
  it('Cairkan asks for confirmation; cancel sends nothing, confirm sends one POST', async () => {
    const posts = mockPayouts('approved', APPROVED_ID)
    const user = userEvent.setup()
    renderCard()

    await user.click(await screen.findByRole('button', { name: 'Cairkan' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText(/Loket Andi/)).toBeInTheDocument()
    expect(within(dialog).getByText(/250\.000/)).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Batal' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    expect(posts).toEqual([])

    await user.click(screen.getByRole('button', { name: 'Cairkan' }))
    const again = await screen.findByRole('alertdialog')
    await user.click(within(again).getByRole('button', { name: 'Cairkan' }))
    await waitFor(() => expect(posts).toEqual(['disburse']))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  })

  it.each([
    ['Setujui', 'approve'],
    ['Tolak', 'reject'],
  ])('%s needs confirmation before POSTing %s', async (label, action) => {
    const posts = mockPayouts('requested', REQUESTED_ID)
    const user = userEvent.setup()
    renderCard()

    await user.click(await screen.findByRole('button', { name: label }))
    const dialog = await screen.findByRole('alertdialog')
    expect(posts).toEqual([])

    await user.click(within(dialog).getByRole('button', { name: label }))
    await waitFor(() => expect(posts).toEqual([action]))
  })

  it('locks the dialog while the request is in flight', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const posts = mockPayouts('approved', APPROVED_ID)
    server.use(
      http.post('*/api/resellers/:id/payouts/:payoutId/disburse', async () => {
        posts.push('disburse')
        await gate
        return HttpResponse.json(payout(APPROVED_ID, 'approved'))
      }),
    )
    const user = userEvent.setup()
    renderCard()

    await user.click(await screen.findByRole('button', { name: 'Cairkan' }))
    const dialog = await screen.findByRole('alertdialog')
    const confirm = within(dialog).getByRole('button', { name: 'Cairkan' })
    await user.dblClick(confirm)

    await waitFor(() => expect(confirm).toBeDisabled())
    expect(within(dialog).getByRole('button', { name: 'Batal' })).toBeDisabled()
    await user.keyboard('{Escape}')
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(posts).toEqual(['disburse'])

    release()
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  })

  it('shows an error toast on 500 and sends no second POST', async () => {
    const posts = mockPayouts('approved', APPROVED_ID)
    server.use(
      http.post('*/api/resellers/:id/payouts/:payoutId/disburse', () => {
        posts.push('disburse')
        return new HttpResponse(JSON.stringify({ message: 'Gagal memproses' }), { status: 500 })
      }),
    )
    const user = userEvent.setup()
    renderCard()

    await user.click(await screen.findByRole('button', { name: 'Cairkan' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cairkan' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    expect(posts).toEqual(['disburse'])
  })
})

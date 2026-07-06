import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { getPortalMe } from '@/api/portal'
import { updateTicket } from '@/api/tickets'
import { renderWithProviders, renderWithRouter } from '@/test/helpers'

import { CsatDialog } from './CsatDialog'
import { CustomerPortalPage } from './CustomerPortalPage'

describe('PortalTicketDetailDialog (via CustomerPortalPage)', () => {
  it('opens a ticket, shows its timeline, and appends a comment', async () => {
    const user = userEvent.setup()
    renderWithRouter(<CustomerPortalPage />)

    // Open the ticket detail from the "Laporan saya" row.
    const row = await screen.findByRole('button', {
      name: /Internet mati total/i,
    })
    await user.click(row)

    // The timeline renders inside the dialog.
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Riwayat')

    // A customer comment is appended and shows up in the thread after refetch.
    const box = await screen.findByLabelText('Balasan')
    await user.type(box, 'Mohon segera dicek ya')
    await user.click(screen.getByRole('button', { name: 'Kirim' }))

    expect(await screen.findByText('Mohon segera dicek ya')).toBeInTheDocument()
  })
})

describe('CsatDialog', () => {
  it('submits a rating on a resolved ticket and closes the prompt', async () => {
    const user = userEvent.setup()
    const me = await getPortalMe()
    const owned = me.tickets[0]
    if (!owned) throw new Error('portal customer has no seeded ticket')
    // Move into a terminal state so CSAT is accepted.
    await updateTicket(owned.id, { status: 'resolved' })

    const onOpenChange = vi.fn()
    renderWithProviders(<CsatDialog ticketId={owned.id} open onOpenChange={onOpenChange} />)

    await user.click(await screen.findByLabelText('Beri 5 bintang'))
    await user.click(screen.getByRole('button', { name: 'Kirim penilaian' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })
})

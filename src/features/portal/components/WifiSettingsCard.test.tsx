import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/helpers'

import { WifiSettingsCard } from './WifiSettingsCard'

describe('WifiSettingsCard', () => {
  it('shows the current SSID from the seed', async () => {
    renderWithProviders(<WifiSettingsCard />)
    expect(await screen.findByText('Ashnet-Home')).toBeInTheDocument()
  })

  it('blocks submit when the password is too short', async () => {
    const user = userEvent.setup()
    renderWithProviders(<WifiSettingsCard />)

    await user.click(await screen.findByRole('button', { name: 'Ubah Wi-Fi' }))
    const dialog = await screen.findByRole('dialog')

    await user.type(within(dialog).getByLabelText('Kata sandi baru'), 'short')
    await user.click(within(dialog).getByRole('button', { name: 'Simpan perubahan' }))

    expect(await within(dialog).findByText('Kata sandi minimal 8 karakter')).toBeInTheDocument()
    // Dialog stays open — the change was not submitted.
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('updates the SSID after a successful change', async () => {
    const user = userEvent.setup()
    renderWithProviders(<WifiSettingsCard />)

    await user.click(await screen.findByRole('button', { name: 'Ubah Wi-Fi' }))
    const dialog = await screen.findByRole('dialog')

    const ssidInput = within(dialog).getByLabelText('Nama Wi-Fi (SSID)')
    await user.clear(ssidInput)
    await user.type(ssidInput, 'Rumah-Budi')
    await user.type(within(dialog).getByLabelText('Kata sandi baru'), 'rahasia123')
    await user.click(within(dialog).getByRole('button', { name: 'Simpan perubahan' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(await screen.findByText('Rumah-Budi')).toBeInTheDocument()
  })
})

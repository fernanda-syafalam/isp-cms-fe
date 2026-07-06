import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/helpers'

import { PortalCredentialDialog } from './PortalCredentialDialog'

const LOGIN = { email: 'budi@example.com', initialPassword: 'Init-CUST-9001' }

describe('PortalCredentialDialog', () => {
  it('reveals the one-time password and the show-once warning when a login exists', () => {
    renderWithProviders(<PortalCredentialDialog portalLogin={LOGIN} onContinue={() => {}} />)

    expect(screen.getByText('Akun portal pelanggan dibuat')).toBeInTheDocument()
    expect(screen.getByText(LOGIN.email)).toBeInTheDocument()
    expect(screen.getByText(LOGIN.initialPassword)).toBeInTheDocument()
    expect(screen.getByText(/hanya ditampilkan satu kali/i)).toBeInTheDocument()
  })

  it('copies the password to the clipboard on "Salin"', async () => {
    // userEvent.setup() installs a clipboard stub on navigator; spy on it so we
    // observe the write our handler triggers.
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)

    renderWithProviders(<PortalCredentialDialog portalLogin={LOGIN} onContinue={() => {}} />)

    await user.click(screen.getByRole('button', { name: 'Salin' }))

    expect(writeText).toHaveBeenCalledWith(LOGIN.initialPassword)
  })

  it('renders nothing when there is no portal login', () => {
    renderWithProviders(<PortalCredentialDialog portalLogin={null} onContinue={() => {}} />)

    expect(screen.queryByText('Akun portal pelanggan dibuat')).not.toBeInTheDocument()
  })
})

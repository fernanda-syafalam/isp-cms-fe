import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/helpers'

import { TwoFactorDialog } from './TwoFactorDialog'

describe('TwoFactorDialog', () => {
  it('enrolls, shows the QR + secret, and confirms with the test code', async () => {
    const user = userEvent.setup({ delay: null })
    const onOpenChange = vi.fn()

    renderWithProviders(<TwoFactorDialog open onOpenChange={onOpenChange} />)

    // Step 1: enrollment renders the manual-entry secret (and the QR svg).
    await waitFor(() => {
      expect(screen.getByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/kode qr/i)).toBeInTheDocument()

    // Step 2: the correct code confirms and closes the dialog.
    await user.type(screen.getByLabelText(/kode verifikasi/i), '123456')
    await user.click(screen.getByRole('button', { name: /aktifkan/i }))

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  }, 20000)

  it('keeps the dialog open and shows an inline error for a wrong code', async () => {
    const user = userEvent.setup({ delay: null })
    const onOpenChange = vi.fn()

    renderWithProviders(<TwoFactorDialog open onOpenChange={onOpenChange} />)

    await waitFor(() => {
      expect(screen.getByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/kode verifikasi/i), '000000')
    await user.click(screen.getByRole('button', { name: /aktifkan/i }))

    await waitFor(() => {
      expect(screen.getByText(/kode salah/i)).toBeInTheDocument()
    })
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  }, 20000)
})

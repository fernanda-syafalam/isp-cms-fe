import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/features/auth/store/authStore'
import { renderWithProviders, resetAuthStore } from '@/test/helpers'
import { server } from '@/test/msw/server'

import { BootstrapForm } from './BootstrapForm'

afterEach(() => {
  resetAuthStore()
})

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/nama lengkap/i), 'Root Admin')
  await user.type(screen.getByLabelText(/email/i), 'admin@example.com')
  await user.type(screen.getByLabelText(/^kata sandi$/i), 'super-secret-123')
  await user.type(screen.getByLabelText(/konfirmasi kata sandi/i), 'super-secret-123')
}

describe('BootstrapForm', () => {
  it('blocks submit and never creates an admin when the form is empty', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()

    renderWithProviders(<BootstrapForm onSuccess={onSuccess} />)
    await user.click(screen.getByRole('button', { name: /buat akun admin/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-invalid', 'true')
    })
    expect(onSuccess).not.toHaveBeenCalled()
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('blocks submit when the password is shorter than 12 characters', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()

    renderWithProviders(<BootstrapForm onSuccess={onSuccess} />)
    await user.type(screen.getByLabelText(/nama lengkap/i), 'Root Admin')
    await user.type(screen.getByLabelText(/email/i), 'admin@example.com')
    await user.type(screen.getByLabelText(/^kata sandi$/i), 'short')
    await user.type(screen.getByLabelText(/konfirmasi kata sandi/i), 'short')
    await user.click(screen.getByRole('button', { name: /buat akun admin/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/^kata sandi$/i)).toHaveAttribute('aria-invalid', 'true')
    })
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('blocks submit when the confirmation does not match', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()

    renderWithProviders(<BootstrapForm onSuccess={onSuccess} />)
    await user.type(screen.getByLabelText(/nama lengkap/i), 'Root Admin')
    await user.type(screen.getByLabelText(/email/i), 'admin@example.com')
    await user.type(screen.getByLabelText(/^kata sandi$/i), 'super-secret-123')
    await user.type(screen.getByLabelText(/konfirmasi kata sandi/i), 'different-secret')
    await user.click(screen.getByRole('button', { name: /buat akun admin/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/konfirmasi kata sandi/i)).toHaveAttribute(
        'aria-invalid',
        'true',
      )
    })
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('creates the admin, logs in, and calls onSuccess on valid submit', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()

    renderWithProviders(<BootstrapForm onSuccess={onSuccess} />)
    await fillValid(user)
    await user.click(screen.getByRole('button', { name: /buat akun admin/i }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1)
    })
    expect(useAuthStore.getState().accessToken).toBe('test-access-token')
  })

  it('does not call onSuccess and keeps the store empty when bootstrap fails', async () => {
    server.use(
      http.post('*/api/auth/bootstrap', () =>
        HttpResponse.json({ message: 'bootstrap already completed' }, { status: 409 }),
      ),
    )

    const user = userEvent.setup()
    const onSuccess = vi.fn()

    renderWithProviders(<BootstrapForm onSuccess={onSuccess} />)
    await fillValid(user)
    await user.click(screen.getByRole('button', { name: /buat akun admin/i }))

    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBeNull()
    })
    expect(onSuccess).not.toHaveBeenCalled()
  })
})

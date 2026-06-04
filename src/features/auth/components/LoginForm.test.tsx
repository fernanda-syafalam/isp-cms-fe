import { afterEach, describe, expect, it, vi } from 'vitest'
import { HttpResponse, http } from 'msw'
import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/react'

import { renderWithProviders, resetAuthStore } from '@/test/helpers'
import { server } from '@/test/msw/server'
import { useAuthStore } from '@/features/auth/store/authStore'

import { LoginForm } from './LoginForm'

afterEach(() => {
  resetAuthStore()
})

describe('LoginForm', () => {
  it('blocks submit and never logs in when the form is empty', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()

    renderWithProviders(<LoginForm onSuccess={onSuccess} />)
    await user.click(screen.getByRole('button', { name: /masuk/i }))

    // Give React + RHF a tick to set the error state.
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-invalid', 'true')
    })
    expect(screen.getByLabelText(/kata sandi/i)).toHaveAttribute('aria-invalid', 'true')
    expect(onSuccess).not.toHaveBeenCalled()
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('blocks submit when the email format is invalid', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()

    renderWithProviders(<LoginForm onSuccess={onSuccess} />)
    await user.type(screen.getByLabelText(/email/i), 'not-an-email')
    await user.type(screen.getByLabelText(/kata sandi/i), 'super-secret')
    await user.click(screen.getByRole('button', { name: /masuk/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-invalid', 'true')
    })
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('logs the user in and calls onSuccess on valid submit', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()

    renderWithProviders(<LoginForm onSuccess={onSuccess} />)
    await user.type(screen.getByLabelText(/email/i), 'admin@example.com')
    await user.type(screen.getByLabelText(/kata sandi/i), 'super-secret')
    await user.click(screen.getByRole('button', { name: /masuk/i }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    expect(useAuthStore.getState().accessToken).toBe('test-access-token')
    expect(useAuthStore.getState().user?.email).toBe('admin@example.com')
  })

  it('does not call onSuccess and keeps the store empty when login fails', async () => {
    server.use(
      http.post('*/api/auth/login', () =>
        HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 }),
      ),
    )

    const user = userEvent.setup()
    const onSuccess = vi.fn()

    renderWithProviders(<LoginForm onSuccess={onSuccess} />)
    await user.type(screen.getByLabelText(/email/i), 'admin@example.com')
    await user.type(screen.getByLabelText(/kata sandi/i), 'wrong-password')
    await user.click(screen.getByRole('button', { name: /masuk/i }))

    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBeNull()
    })
    expect(onSuccess).not.toHaveBeenCalled()
  })
})

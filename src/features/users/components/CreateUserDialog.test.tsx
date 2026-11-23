import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/helpers'
import { server } from '@/test/msw/server'

import { CreateUserDialog } from './CreateUserDialog'

describe('CreateUserDialog', () => {
  it('shows server field errors under the matching field', async () => {
    server.use(
      http.post('*/api/users', () =>
        HttpResponse.json(
          {
            title: 'Bad Request',
            status: 400,
            errors: [{ path: ['email'], message: 'Email sudah terdaftar', code: 'custom' }],
          },
          { status: 400 },
        ),
      ),
    )
    const u = userEvent.setup()
    renderWithProviders(<CreateUserDialog />)

    await u.click(screen.getByRole('button', { name: 'Staf baru' }))
    await u.type(await screen.findByLabelText('Nama'), 'Jane Doe')
    await u.type(screen.getByLabelText('Email'), 'jane@example.com')
    await u.type(screen.getByLabelText('Kata sandi'), 'a-long-password-123')
    await u.click(screen.getByRole('button', { name: /simpan|buat|tambah/i }))

    expect(await screen.findByText('Email sudah terdaftar')).toBeInTheDocument()
  })

  it('does not offer the mitra or customer roles', async () => {
    const u = userEvent.setup()
    renderWithProviders(<CreateUserDialog />)

    await u.click(screen.getByRole('button', { name: 'Staf baru' }))
    const trigger = await screen.findByRole('combobox', { name: 'Peran' })
    trigger.focus()
    await u.keyboard('{Enter}')

    const options = (await screen.findAllByRole('option')).map((o) => o.textContent)
    expect(options).toHaveLength(3)
    expect(options.join(' ')).not.toMatch(/mitra|pelanggan|customer/i)
  })

  it('submits role staff when the role is left untouched', async () => {
    let body: Record<string, unknown> | null = null
    server.use(
      http.post('*/api/users', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ title: 'Bad Request', status: 400 }, { status: 400 })
      }),
    )
    const u = userEvent.setup()
    renderWithProviders(<CreateUserDialog />)

    await u.click(screen.getByRole('button', { name: 'Staf baru' }))
    await u.type(await screen.findByLabelText('Nama'), 'Jane Doe')
    await u.type(screen.getByLabelText('Email'), 'jane@example.com')
    await u.type(screen.getByLabelText('Kata sandi'), 'a-long-password-123')
    await u.click(screen.getByRole('button', { name: /simpan|buat|tambah/i }))

    await waitFor(() => expect(body).not.toBeNull())
    expect(body).toMatchObject({ role: 'staff' })
  })
})

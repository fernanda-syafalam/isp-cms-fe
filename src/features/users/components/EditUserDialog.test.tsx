import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import type { AppUser } from '@/schemas/user'
import { renderWithProviders } from '@/test/helpers'
import { server } from '@/test/msw/server'

import { EditUserDialog } from './EditUserDialog'

const mitraUser: AppUser = {
  id: '11111111-1111-4111-8111-111111111111' as AppUser['id'],
  email: 'mitra@example.com',
  fullName: 'Mitra Lama',
  role: 'mitra',
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('EditUserDialog', () => {
  it('omits role from the PATCH body when only the name of a mitra user changes', async () => {
    let body: Record<string, unknown> | null = null
    server.use(
      http.patch('*/api/users/:id', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...mitraUser, fullName: 'Mitra Baru' })
      }),
    )
    const u = userEvent.setup()
    renderWithProviders(<EditUserDialog user={mitraUser} open onOpenChange={() => undefined} />)

    const name = await screen.findByLabelText('Nama')
    await u.clear(name)
    await u.type(name, 'Mitra Baru')
    await u.click(screen.getByRole('button', { name: /simpan/i }))

    await waitFor(() => expect(body).not.toBeNull())
    expect(body).toEqual({ fullName: 'Mitra Baru' })
  })
})

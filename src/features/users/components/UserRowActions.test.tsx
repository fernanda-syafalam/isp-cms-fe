import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { AppUserSchema } from '@/schemas/user'
import { renderWithProviders } from '@/test/helpers'

import { UserRowActions } from './UserRowActions'

const user = AppUserSchema.parse({
  id: '00000000-0000-4000-8000-000000000001',
  email: 'jane@example.com',
  fullName: 'Jane Doe',
  role: 'staff',
  createdAt: '2026-01-01T00:00:00.000Z',
})

describe('UserRowActions', () => {
  it('opens the edit dialog prefilled with the staff member', async () => {
    const u = userEvent.setup()
    renderWithProviders(<UserRowActions user={user} />)

    expect(screen.queryByText('Edit staf')).not.toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: 'Edit Jane Doe' }))

    expect(await screen.findByText('Edit staf')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument()
  })
})

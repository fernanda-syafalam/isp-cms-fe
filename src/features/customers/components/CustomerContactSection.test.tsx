import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useAuthStore } from '@/features/auth/store/authStore'
import { TEST_USER, renderWithProviders, resetAuthStore } from '@/test/helpers'
import { server } from '@/test/msw/server'

import { CustomerContact } from './CustomerContactSection'
import { EDIT_TEST_CUSTOMER } from '@/test/fixtures/customer'

describe('CustomerContact', () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: 'token', user: TEST_USER })
  })
  afterEach(() => resetAuthStore())

  it('saves a phone edit without planId in the PATCH body', async () => {
    const user = userEvent.setup()
    const bodies: unknown[] = []
    server.use(
      http.patch('*/api/customers/:id', async ({ request }) => {
        const body: unknown = await request.json()
        bodies.push(body)
        if (typeof body === 'object' && body !== null && 'planId' in body) {
          return HttpResponse.json({ message: 'planId not allowed' }, { status: 400 })
        }
        return HttpResponse.json({ ...EDIT_TEST_CUSTOMER, phone: '081299998888' })
      }),
    )

    renderWithProviders(<CustomerContact customer={EDIT_TEST_CUSTOMER} />)

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    const phone = screen.getByLabelText('Telepon')
    await user.clear(phone)
    await user.type(phone, '081299998888')
    await user.click(screen.getByRole('button', { name: 'Simpan' }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).not.toHaveProperty('planId')
    expect(bodies[0]).toMatchObject({ phone: '081299998888' })
    await waitFor(() => expect(screen.queryByLabelText('Telepon')).not.toBeInTheDocument())
  })
})

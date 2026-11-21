import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/helpers'
import { server } from '@/test/msw/server'

import { EDIT_TEST_CUSTOMER } from '@/test/fixtures/customer'
import { EditCustomerDialog } from './EditCustomerDialog'

describe('EditCustomerDialog', () => {
  it('submits the edit without planId and has no plan field', async () => {
    const user = userEvent.setup()
    const bodies: unknown[] = []
    server.use(
      http.patch('*/api/customers/:id', async ({ request }) => {
        const body: unknown = await request.json()
        bodies.push(body)
        if (typeof body === 'object' && body !== null && 'planId' in body) {
          return HttpResponse.json({ message: 'planId not allowed' }, { status: 400 })
        }
        return HttpResponse.json({ ...EDIT_TEST_CUSTOMER, fullName: 'Budi Baru' })
      }),
    )
    let closed = false

    renderWithProviders(
      <EditCustomerDialog
        customer={EDIT_TEST_CUSTOMER}
        open
        onOpenChange={(open) => {
          if (!open) closed = true
        }}
      />,
    )

    expect(screen.queryByText('Paket')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()

    const name = screen.getByLabelText('Nama')
    await user.clear(name)
    await user.type(name, 'Budi Baru')
    await user.click(screen.getByRole('button', { name: 'Simpan' }))

    await waitFor(() => expect(closed).toBe(true))
    expect(bodies).toHaveLength(1)
    expect(bodies[0]).not.toHaveProperty('planId')
    expect(bodies[0]).toMatchObject({ fullName: 'Budi Baru' })
  })
})

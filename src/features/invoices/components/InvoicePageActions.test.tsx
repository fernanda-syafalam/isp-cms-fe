import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { InvoiceSchema } from '@/schemas/invoice'
import { renderWithProviders } from '@/test/helpers'
import { server } from '@/test/msw/server'

import { PayMenu } from './InvoicePageActions'

const invoice = InvoiceSchema.parse({
  id: '44444444-4444-4444-8444-444444444444',
  invoiceNo: 'INV-2026-100',
  customerId: '11111111-1111-4111-8111-111111111111',
  customerName: 'Budi Santoso',
  periodStart: '2026-04-01',
  periodEnd: '2026-04-30',
  amount: 200_000,
  lateFee: 0,
  taxAmount: 22_000,
  discountAmount: 0,
  paidAmount: 0,
  balanceDue: 222_000,
  taxInvoiceNo: null,
  status: 'pending',
  dueDate: '2026-05-10',
  paidAt: null,
  lastRemindedAt: null,
  type: 'regular',
  note: null,
})

describe('PayMenu', () => {
  it('opens the loket dialog and does not POST until submitted', async () => {
    let posts = 0
    server.use(
      http.post('*/api/invoices/:id/pay', () => {
        posts += 1
        return HttpResponse.json(invoice)
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<PayMenu invoice={invoice} />)

    await user.click(screen.getByRole('button', { name: 'Catat manual' }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/saldo tertagih.*222\.000/i)).toBeInTheDocument()
    expect(posts).toBe(0)
  })
})

import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { InvoiceSchema } from '@/schemas/invoice'
import { renderWithProviders } from '@/test/helpers'

import { LoketPayDialog } from './LoketPayDialog'

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
})

describe('LoketPayDialog', () => {
  it('shows the balance and live-computes cash change (kembalian)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoketPayDialog invoice={invoice} open onOpenChange={vi.fn()} />)

    // Balance is shown prominently in the description (currency has an nbsp).
    expect(screen.getByText(/saldo tertagih.*222\.000/i)).toBeInTheDocument()

    const tendered = screen.getByLabelText(/uang diterima/i)
    await user.clear(tendered)
    await user.type(tendered, '250000')

    // change = 250.000 − 222.000 = 28.000
    await waitFor(() => {
      expect(screen.getByText(/28\.000/)).toBeInTheDocument()
    })
  })

  it('blocks an overpayment above the balance', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderWithProviders(<LoketPayDialog invoice={invoice} open onOpenChange={onOpenChange} />)

    const amount = screen.getByLabelText(/jumlah bayar/i)
    await user.clear(amount)
    await user.type(amount, '300000')
    await user.click(screen.getByRole('button', { name: /simpan/i }))

    await waitFor(() => {
      expect(screen.getByText(/melebihi saldo tertagih/i)).toBeInTheDocument()
    })
    // Invalid submit never closes the dialog / fires the mutation success.
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('blocks a cash payment when tendered is less than the amount', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoketPayDialog invoice={invoice} open onOpenChange={vi.fn()} />)

    const tendered = screen.getByLabelText(/uang diterima/i)
    await user.clear(tendered)
    await user.type(tendered, '100000')
    await user.click(screen.getByRole('button', { name: /simpan/i }))

    await waitFor(() => {
      expect(screen.getByText(/uang diterima kurang dari jumlah bayar/i)).toBeInTheDocument()
    })
  })
})

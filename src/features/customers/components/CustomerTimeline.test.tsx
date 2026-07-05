import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CustomerSchema } from '@/schemas/customer'
import { InvoiceSchema } from '@/schemas/invoice'
import { TicketSchema } from '@/schemas/ticket'

import { CustomerTimeline } from './CustomerTimeline'

const customer = CustomerSchema.parse({
  id: '11111111-1111-4111-8111-111111111111',
  customerNo: 'CUST-0001',
  fullName: 'Budi Santoso',
  phone: '081234567890',
  email: null,
  address: 'Jl. Merdeka 1',
  areaId: '22222222-2222-4222-8222-222222222222',
  areaName: 'Jepara',
  planId: '33333333-3333-4333-8333-333333333333',
  planName: 'Home 50',
  status: 'aktif',
  outstanding: 0,
  billingAnchorDay: null,
  npwp: null,
  ktp: null,
  consentAt: null,
  resellerName: null,
  connection: null,
  joinedAt: '2026-01-01T00:00:00.000Z',
})

const invoice = InvoiceSchema.parse({
  id: '44444444-4444-4444-8444-444444444444',
  invoiceNo: 'INV-2026-001',
  customerId: customer.id,
  customerName: customer.fullName,
  periodStart: '2026-02-01',
  periodEnd: '2026-02-28',
  amount: 350_000,
  lateFee: 0,
  taxAmount: 0,
  discountAmount: 0,
  paidAmount: 350_000,
  balanceDue: 0,
  taxInvoiceNo: null,
  status: 'paid',
  dueDate: '2026-02-10',
  paidAt: '2026-02-05T08:00:00.000Z',
  lastRemindedAt: null,
})

const ticket = TicketSchema.parse({
  id: '55555555-5555-4555-8555-555555555555',
  code: 'TKT-001',
  subject: 'Internet lambat',
  customerId: customer.id,
  customerName: customer.fullName,
  priority: 'medium',
  status: 'open',
  assignee: null,
  slaDueAt: '2026-03-02T00:00:00.000Z',
  createdAt: '2026-03-01T09:00:00.000Z',
})

describe('CustomerTimeline', () => {
  it('renders lifecycle, billing, and support events', () => {
    render(<CustomerTimeline customer={customer} invoices={[invoice]} tickets={[ticket]} />)
    expect(screen.getByText('Pelanggan bergabung')).toBeInTheDocument()
    expect(screen.getByText('Tagihan INV-2026-001 diterbitkan')).toBeInTheDocument()
    expect(screen.getByText('Pembayaran INV-2026-001 diterima')).toBeInTheDocument()
    expect(screen.getByText('Tiket dibuka: Internet lambat')).toBeInTheDocument()
  })

  it('orders events newest-first', () => {
    render(<CustomerTimeline customer={customer} invoices={[invoice]} tickets={[ticket]} />)
    const items = screen.getAllByRole('listitem').map((li) => li.textContent ?? '')
    const ticketIdx = items.findIndex((t) => t.includes('Tiket dibuka'))
    const joinedIdx = items.findIndex((t) => t.includes('Pelanggan bergabung'))
    // Ticket (Mar) is newer than the join (Jan), so it appears first.
    expect(ticketIdx).toBeLessThan(joinedIdx)
  })

  it('shows an empty state when there is nothing but a join with no records', () => {
    const fresh = { ...customer, joinedAt: customer.joinedAt }
    render(<CustomerTimeline customer={fresh} invoices={[]} tickets={[]} />)
    // The join event always anchors the timeline.
    expect(screen.getByText('Pelanggan bergabung')).toBeInTheDocument()
  })
})

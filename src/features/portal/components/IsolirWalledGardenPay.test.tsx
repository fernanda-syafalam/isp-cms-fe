import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { CustomerSchema } from '@/schemas/customer'
import { InvoiceSchema } from '@/schemas/invoice'
import type { PaymentIntent } from '@/schemas/payment'
import type { InvoiceId } from '@/types/ids'
import { renderWithRouter } from '@/test/helpers'
import { server } from '@/test/msw/server'

import { IsolirWalledGarden } from './IsolirWalledGarden'

// pelanggan2 is a seeded punitive-isolir subscriber; invoice #2 is their only
// unpaid invoice. Settling it in the mock reactivates them (isolir → aktif).
const CUSTOMER_EMAIL = 'pelanggan2@example.com'
const CUSTOMER_ID = 'aaaaaaaa-1111-4111-8111-000000000002'
const INVOICE_ID = 'cccccccc-1111-4111-8111-000000000002'

const CUSTOMER = CustomerSchema.parse({
  id: CUSTOMER_ID,
  customerNo: 'CUST-1003',
  fullName: 'Pelanggan C2',
  phone: '081200000002',
  email: CUSTOMER_EMAIL,
  address: 'Jl. Pemuda No. 3, Jepara',
  areaId: null,
  areaName: 'Pecangaan',
  planId: '22222222-2222-4222-8222-222222222222',
  planName: 'Home 20',
  status: 'isolir',
  holdReason: 'overdue',
  outstanding: 555_000,
  billingAnchorDay: null,
  npwp: null,
  ktp: null,
  consentAt: null,
  resellerName: null,
  connection: null,
  joinedAt: '2025-01-01T00:00:00.000Z',
})

const INVOICE = InvoiceSchema.parse({
  id: INVOICE_ID,
  invoiceNo: 'INV-2026-102',
  customerId: CUSTOMER_ID,
  customerName: 'Pelanggan C2',
  periodStart: '2026-04-01',
  periodEnd: '2026-04-30',
  amount: 500_000,
  lateFee: 0,
  taxAmount: 55_000,
  discountAmount: 0,
  paidAmount: 0,
  balanceDue: 555_000,
  taxInvoiceNo: null,
  status: 'pending',
  dueDate: '2026-05-10',
  paidAt: null,
  lastRemindedAt: null,
  type: 'regular',
  note: null,
})

function trackRequests() {
  const seen: string[] = []
  server.events.on('request:start', ({ request }) => {
    seen.push(`${request.method} ${new URL(request.url).pathname}`)
  })
  return seen
}

afterEach(() => server.events.removeAllListeners('request:start'))

describe('IsolirWalledGarden — pay → poll → reactivate (mock)', () => {
  it('settles via the poll route and reactivates the subscriber, never calling confirm', async () => {
    const user = userEvent.setup()
    const seen = trackRequests()
    renderWithRouter(
      <IsolirWalledGarden
        customer={CUSTOMER}
        invoices={[INVOICE]}
        outstanding={555_000}
        oldestUnpaid={INVOICE}
        intentByInvoice={new Map<InvoiceId, PaymentIntent>()}
      />,
    )

    // Open the pay dialog, create the charge, then let the poll settle it.
    await user.click(await screen.findByRole('button', { name: /bayar sekarang/i }))
    await user.click(await screen.findByRole('button', { name: /lanjut bayar/i }))
    await waitFor(() => expect(screen.queryByText('Bayar online')).not.toBeInTheDocument())

    // Settlement went through the read/poll path, not the removed confirm route.
    expect(seen.some((r) => /^GET \/api\/portal\/pay-intent\/[^/]+$/.test(r))).toBe(true)
    expect(seen.some((r) => /\/confirm$/.test(r))).toBe(false)

    // The mock reactivated the subscriber: their own /portal/me now reads aktif.
    const res = await fetch('http://test.local/api/portal/me', {
      headers: { Authorization: `Bearer test~${CUSTOMER_EMAIL}` },
    })
    const me = (await res.json()) as { customer: { status: string } }
    expect(me.customer.status).toBe('aktif')
  })
})

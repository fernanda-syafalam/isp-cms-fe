import { useState } from 'react'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { InvoiceSchema } from '@/schemas/invoice'
import { PaymentIntentSchema } from '@/schemas/payment'
import { renderWithProviders } from '@/test/helpers'
import { server } from '@/test/msw/server'

import { CheckoutDialog } from './CheckoutDialog'

// Poll cadence mirrored from useCheckout: interval 3s, client-side timeout 120s.
// Duplicated (not imported) so the test locks the observable contract — if the
// hook's constants change, this test should be updated deliberately.
const PORTAL_POLL_INTERVAL_MS = 3000
const PORTAL_POLL_TIMEOUT_MS = 120_000

// A seeded, still-unpaid invoice — its id matches an INVOICE_FIXTURES row so the
// mock create-intent route resolves it (and the poll route can settle it).
const PORTAL_INVOICE = InvoiceSchema.parse({
  id: 'cccccccc-1111-4111-8111-000000000002',
  invoiceNo: 'INV-2026-102',
  customerId: 'aaaaaaaa-1111-4111-8111-000000000002',
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

// A pending intent for the invoice above — passed as `existingIntent` so the
// portal poll starts on mount (no create click), letting the whole poll lifecycle
// run under fake timers deterministically.
const PENDING_INTENT = PaymentIntentSchema.parse({
  id: 'dddddddd-2222-4222-8222-000000000002',
  invoiceId: PORTAL_INVOICE.id,
  invoiceNo: PORTAL_INVOICE.invoiceNo,
  customerName: PORTAL_INVOICE.customerName,
  amount: 555_000,
  channel: 'qris',
  status: 'pending',
  vaNumber: null,
  qrPayload: 'ID.MOCK.QRIS|qris|INV-2026-102|555000',
  createdAt: '2026-05-01T00:00:00.000Z',
  expiresAt: '2999-01-01T00:00:00.000Z',
  paidAt: null,
})

// A dialog whose open state is driven by the component under test, so an
// onOpenChange(false) from the poll actually closes it (as in real usage).
function PortalCheckoutHarness() {
  const [open, setOpen] = useState(true)
  return (
    <CheckoutDialog invoice={PORTAL_INVOICE} open={open} onOpenChange={setOpen} scope="portal" />
  )
}

// Record every request MSW sees so we can prove which routes the flow hit.
function trackRequests() {
  const seen: string[] = []
  const listener = ({ request }: { request: Request }) => {
    seen.push(`${request.method} ${new URL(request.url).pathname}`)
  }
  server.events.on('request:start', listener)
  return seen
}

afterEach(() => server.events.removeAllListeners('request:start'))

describe('CheckoutDialog (portal scope)', () => {
  it('polls the status endpoint and completes on paid, never calling the removed confirm route', async () => {
    const user = userEvent.setup()
    const seen = trackRequests()
    renderWithProviders(<PortalCheckoutHarness />)

    // Create the charge, then the dialog auto-polls until the mock gateway
    // settles it (on the first poll) and the dialog closes.
    await user.click(await screen.findByRole('button', { name: /lanjut bayar/i }))
    await waitFor(() => expect(screen.queryByText('Bayar online')).not.toBeInTheDocument())

    const created = seen.some((r) => r === 'POST /api/portal/pay-intent')
    const polled = seen.some((r) => /^GET \/api\/portal\/pay-intent\/[^/]+$/.test(r))
    const confirmed = seen.some((r) => /\/confirm$/.test(r))
    expect(created).toBe(true)
    expect(polled).toBe(true)
    // The self-settle route is gone — the portal must never call it (SEC-H1).
    expect(confirmed).toBe(false)
  })

  it('shows the "waiting for confirmation" state while the intent is pending, with no confirm affordance', async () => {
    const user = userEvent.setup()
    const seen = trackRequests()
    // Freeze the intent as pending so the waiting state is stable to assert.
    server.use(
      http.get('*/api/portal/pay-intent/:id', ({ params }) =>
        HttpResponse.json({
          id: params.id,
          invoiceId: PORTAL_INVOICE.id,
          invoiceNo: PORTAL_INVOICE.invoiceNo,
          customerName: PORTAL_INVOICE.customerName,
          amount: 555_000,
          channel: 'qris',
          status: 'pending',
          vaNumber: null,
          qrPayload: 'ID.MOCK.QRIS|qris|INV-2026-102|555000',
          createdAt: '2026-05-01T00:00:00.000Z',
          expiresAt: '2999-01-01T00:00:00.000Z',
          paidAt: null,
        }),
      ),
    )
    renderWithProviders(<PortalCheckoutHarness />)

    await user.click(await screen.findByRole('button', { name: /lanjut bayar/i }))

    // The customer sees the QRIS payload + a clear waiting state, and there is
    // NO "simulate success" button (that affordance is staff-only now).
    expect(await screen.findByText(/menunggu konfirmasi pembayaran/i)).toBeInTheDocument()
    expect(screen.getByText(/scan qris dengan aplikasi apa pun/i)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /simulasikan pembayaran berhasil/i }),
    ).not.toBeInTheDocument()
    expect(seen.some((r) => /\/confirm$/.test(r))).toBe(false)
  })

  it('stops polling and shows the belum-settle waiting copy after the 120s timeout', async () => {
    vi.useFakeTimers()
    try {
      const seen = trackRequests()
      const pollCount = () =>
        seen.filter((r) => /^GET \/api\/portal\/pay-intent\/[^/]+$/.test(r)).length

      // The intent never settles, so only the client-side timeout can end the
      // poll — exactly the branch under test.
      server.use(
        http.get('*/api/portal/pay-intent/:id', ({ params }) =>
          HttpResponse.json({
            id: params.id,
            invoiceId: PORTAL_INVOICE.id,
            invoiceNo: PORTAL_INVOICE.invoiceNo,
            customerName: PORTAL_INVOICE.customerName,
            amount: 555_000,
            channel: 'qris',
            status: 'pending',
            vaNumber: null,
            qrPayload: 'ID.MOCK.QRIS|qris|INV-2026-102|555000',
            createdAt: '2026-05-01T00:00:00.000Z',
            expiresAt: '2999-01-01T00:00:00.000Z',
            paidAt: null,
          }),
        ),
      )

      // Seed the pending intent so the poll runs immediately on mount.
      const dialog = (
        <CheckoutDialog
          invoice={PORTAL_INVOICE}
          open
          onOpenChange={() => {}}
          scope="portal"
          existingIntent={PENDING_INTENT}
        />
      )
      const { rerender } = renderWithProviders(dialog)

      // Before the timeout the customer sees the active waiting copy, not the
      // give-up copy.
      expect(screen.getByText(/menunggu konfirmasi pembayaran/i)).toBeInTheDocument()
      expect(screen.queryByText(/belum menerima konfirmasi/i)).not.toBeInTheDocument()

      // Advance past the timeout (plus one interval so the final scheduled poll
      // fires and the refetchInterval then returns false, halting the poll).
      await act(async () => {
        await vi.advanceTimersByTimeAsync(PORTAL_POLL_TIMEOUT_MS + PORTAL_POLL_INTERVAL_MS + 100)
      })

      // The pending status never changes reference, so React Query's smart
      // tracking does not re-render the dialog on its own; a normal re-render
      // (as any live parent state would trigger) surfaces the now-true
      // isTimedOut. This asserts the timeout branch, not a specific re-render
      // cause.
      rerender(dialog)

      // (a) The give-up footer copy is now shown.
      expect(screen.getByText(/belum menerima konfirmasi/i)).toBeInTheDocument()

      // (b) Polling has stopped — the client-side timeout halted the poll, so
      // advancing further triggers no more GETs.
      const pollsAtTimeout = pollCount()
      expect(pollsAtTimeout).toBeGreaterThan(0)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(PORTAL_POLL_INTERVAL_MS * 4)
      })
      expect(pollCount()).toBe(pollsAtTimeout)

      // The self-settle route stays untouched throughout (SEC-H1).
      expect(seen.some((r) => /\/confirm$/.test(r))).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })
})

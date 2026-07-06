import { Link } from '@tanstack/react-router'
import { CreditCardIcon, FileTextIcon, ReceiptTextIcon } from 'lucide-react'
import { useState } from 'react'

import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckoutDialog } from '@/features/invoices'
import { formatCurrency, formatDate } from '@/lib/format'
import { invoiceTotal } from '@/lib/invoice'
import { statusLabel } from '@/lib/status-label'
import type { Invoice } from '@/schemas/invoice'
import type { PaymentIntent } from '@/schemas/payment'

// Prominent "pay now" card — the primary action when there is a balance. Pays
// the oldest unpaid invoice via the shared checkout dialog (portal-scoped so a
// customer never hits the staff /payments/intent route). Resumes a pending
// intent for that invoice when one already exists.
export function PayNowCard({
  invoice,
  outstanding,
  count,
  pendingIntent,
}: {
  invoice: Invoice
  outstanding: number
  count: number
  pendingIntent?: PaymentIntent | undefined
}) {
  const [payOpen, setPayOpen] = useState(false)
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
        <div>
          <p className="text-muted-foreground text-sm">Total tagihan belum dibayar</p>
          <p className="font-bold font-mono text-2xl tabular-nums">{formatCurrency(outstanding)}</p>
          <p className="mt-0.5 text-muted-foreground text-xs">
            {count} tagihan · jatuh tempo paling awal {formatDate(invoice.dueDate)}
          </p>
        </div>
        <Button onClick={() => setPayOpen(true)}>
          <CreditCardIcon className="size-4" />
          {pendingIntent ? 'Lanjutkan pembayaran' : 'Bayar sekarang'}
        </Button>
        <CheckoutDialog
          invoice={invoice}
          open={payOpen}
          onOpenChange={setPayOpen}
          scope="portal"
          existingIntent={pendingIntent}
        />
      </CardContent>
    </Card>
  )
}

// The print (faktur/kwitansi) link for a portal invoice row. Reads from the
// cached portal/me snapshot — the print page issues no extra backend call.
function PortalInvoicePrintLink({ invoice }: { invoice: Invoice }) {
  const isPaid = invoice.status === 'paid'
  return (
    <Button asChild size="sm" variant="ghost">
      <Link to="/portal/invoices/$invoiceId/print" params={{ invoiceId: invoice.id }}>
        {isPaid ? <ReceiptTextIcon className="size-4" /> : <FileTextIcon className="size-4" />}
        {isPaid ? 'Kwitansi' : 'Faktur'}
      </Link>
    </Button>
  )
}

// One row in the "Tagihan saya" list, with an inline pay button when unpaid. A
// still-pending QRIS/VA intent surfaces a "Menunggu pembayaran" badge and a
// "Lanjutkan" resume button instead of starting a fresh checkout (P3.C.3).
export function PortalInvoiceRow({
  invoice,
  pendingIntent,
}: {
  invoice: Invoice
  pendingIntent?: PaymentIntent | undefined
}) {
  const [payOpen, setPayOpen] = useState(false)
  const unpaid = invoice.status === 'pending' || invoice.status === 'overdue'
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="font-mono font-medium text-sm">{invoice.invoiceNo}</p>
        <p className="text-muted-foreground text-xs">
          Jatuh tempo {formatDate(invoice.dueDate)} · {formatCurrency(invoiceTotal(invoice))}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <StatusBadge
          tone={
            invoice.status === 'paid'
              ? 'success'
              : invoice.status === 'overdue'
                ? 'danger'
                : 'warning'
          }
          label={statusLabel(invoice.status)}
        />
        {unpaid && pendingIntent ? (
          <StatusBadge tone="info" label="Menunggu pembayaran (QRIS/VA)" />
        ) : null}
        <PortalInvoicePrintLink invoice={invoice} />
        {unpaid ? (
          <>
            <Button size="sm" onClick={() => setPayOpen(true)}>
              <CreditCardIcon className="size-4" />
              {pendingIntent ? 'Lanjutkan' : 'Bayar'}
            </Button>
            <CheckoutDialog
              invoice={invoice}
              open={payOpen}
              onOpenChange={setPayOpen}
              scope="portal"
              existingIntent={pendingIntent}
            />
          </>
        ) : null}
      </div>
    </li>
  )
}

import { CreditCardIcon } from 'lucide-react'
import { useState } from 'react'

import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckoutDialog } from '@/features/invoices'
import { formatCurrency, formatDate } from '@/lib/format'
import { invoiceTotal } from '@/lib/invoice'
import { statusLabel } from '@/lib/status-label'
import type { Invoice } from '@/schemas/invoice'

// Prominent "pay now" card — the primary action when there is a balance. Pays
// the oldest unpaid invoice via the shared checkout dialog.
export function PayNowCard({
  invoice,
  outstanding,
  count,
}: {
  invoice: Invoice
  outstanding: number
  count: number
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
          Bayar sekarang
        </Button>
        <CheckoutDialog invoice={invoice} open={payOpen} onOpenChange={setPayOpen} />
      </CardContent>
    </Card>
  )
}

// One row in the "Tagihan saya" list, with an inline pay button when unpaid.
export function PortalInvoiceRow({ invoice }: { invoice: Invoice }) {
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
      <div className="flex items-center gap-2">
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
        {unpaid ? (
          <>
            <Button size="sm" onClick={() => setPayOpen(true)}>
              <CreditCardIcon className="size-4" />
              Bayar
            </Button>
            <CheckoutDialog invoice={invoice} open={payOpen} onOpenChange={setPayOpen} />
          </>
        ) : null}
      </div>
    </li>
  )
}

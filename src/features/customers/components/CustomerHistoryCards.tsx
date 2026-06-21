import { Link } from '@tanstack/react-router'

import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/format'
import { invoiceTotal } from '@/lib/invoice'
import { statusLabel } from '@/lib/status-label'
import type { Invoice, InvoiceStatus } from '@/schemas/invoice'
import type { Ticket, TicketStatus } from '@/schemas/ticket'

const INVOICE_TONE: Record<InvoiceStatus, StatusTone> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'danger',
  draft: 'neutral',
}

const TICKET_TONE: Record<TicketStatus, StatusTone> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  breached: 'danger',
}

export function InvoicesCard({ invoices }: { invoices: Invoice[] | undefined }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tagihan terakhir</CardTitle>
      </CardHeader>
      <CardContent>
        {!invoices ? (
          <Skeleton className="h-20 w-full" />
        ) : invoices.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-sm">Belum ada tagihan.</p>
        ) : (
          <ul className="divide-y divide-border">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <Link
                    to="/invoices/$invoiceId"
                    params={{ invoiceId: inv.id }}
                    className="font-medium font-mono text-sm hover:underline"
                  >
                    {inv.invoiceNo}
                  </Link>
                  <p className="text-muted-foreground text-xs">
                    Jatuh tempo {formatDate(inv.dueDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm tabular-nums">
                    {formatCurrency(invoiceTotal(inv))}
                  </span>
                  <StatusBadge tone={INVOICE_TONE[inv.status]} label={statusLabel(inv.status)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function TicketsCard({ tickets }: { tickets: Ticket[] | undefined }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tiket terkait</CardTitle>
      </CardHeader>
      <CardContent>
        {!tickets ? (
          <Skeleton className="h-20 w-full" />
        ) : tickets.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-sm">Belum ada tiket.</p>
        ) : (
          <ul className="divide-y divide-border">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{ticket.subject}</p>
                  <p className="font-mono text-muted-foreground text-xs">{ticket.code}</p>
                </div>
                <StatusBadge tone={TICKET_TONE[ticket.status]} label={statusLabel(ticket.status)} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

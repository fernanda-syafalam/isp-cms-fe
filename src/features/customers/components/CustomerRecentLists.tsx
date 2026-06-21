import { Link } from '@tanstack/react-router'

import { DetailSection } from '@/components/shared/detail-sheet'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/format'
import { invoiceTotal } from '@/lib/invoice'
import { statusLabel } from '@/lib/status-label'
import type { InvoiceStatus } from '@/schemas/invoice'
import type { TicketStatus } from '@/schemas/ticket'

import { useCustomerInvoices } from '../hooks/useCustomerInvoices'
import { useCustomerTickets } from '../hooks/useCustomerTickets'

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

// Recent invoices for this subscriber (top 5) — in-context lookup without
// leaving for the 360° page; rows link to the full invoice.
export function RecentInvoices({ customerId }: { customerId: string }) {
  const { data, isLoading } = useCustomerInvoices(customerId)
  return (
    <DetailSection title="Tagihan terbaru">
      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : !data || data.length === 0 ? (
        <p className="text-muted-foreground text-sm">Belum ada tagihan.</p>
      ) : (
        <ul className="divide-y divide-sidebar-border overflow-hidden rounded-lg border border-sidebar-border">
          {data.map((inv) => (
            <li key={inv.id}>
              <Link
                to="/invoices/$invoiceId"
                params={{ invoiceId: inv.id }}
                className="flex items-center justify-between gap-3 px-3 py-2 transition-colors hover:bg-sidebar-accent"
              >
                <div className="min-w-0">
                  <p className="font-medium font-mono text-sm">{inv.invoiceNo}</p>
                  <p className="text-muted-foreground text-xs">
                    Jatuh tempo {formatDate(inv.dueDate)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-sm tabular-nums">
                    {formatCurrency(invoiceTotal(inv))}
                  </span>
                  <StatusBadge tone={INVOICE_TONE[inv.status]} label={statusLabel(inv.status)} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DetailSection>
  )
}

// Recent tickets for this subscriber (top 8); rows link to the full ticket.
export function RecentTickets({ customerName }: { customerName: string }) {
  const { data, isLoading } = useCustomerTickets(customerName)
  return (
    <DetailSection title="Tiket terbaru">
      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : !data || data.length === 0 ? (
        <p className="text-muted-foreground text-sm">Belum ada tiket.</p>
      ) : (
        <ul className="divide-y divide-sidebar-border overflow-hidden rounded-lg border border-sidebar-border">
          {data.map((t) => (
            <li key={t.id}>
              <Link
                to="/tickets/$ticketId"
                params={{ ticketId: t.id }}
                className="flex items-center justify-between gap-3 px-3 py-2 transition-colors hover:bg-sidebar-accent"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">{t.subject}</p>
                  <p className="font-mono text-muted-foreground text-xs">{t.code}</p>
                </div>
                <StatusBadge tone={TICKET_TONE[t.status]} label={statusLabel(t.status)} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DetailSection>
  )
}

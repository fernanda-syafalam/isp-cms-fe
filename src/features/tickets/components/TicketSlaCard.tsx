import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/cn'
import { formatDateTime } from '@/lib/format'
import { slaState } from '@/lib/sla'
import { statusLabel } from '@/lib/status-label'
import type { Ticket } from '@/schemas/ticket'

// "Detail" card — the SLA countdown bar plus the ticket metadata rows.
export function TicketSlaCard({ ticket }: { ticket: Ticket }) {
  const now = Date.now()
  const sla = slaState(ticket.status, ticket.slaDueAt, now)
  // Countdown bar: % of the createdAt→slaDueAt window already elapsed.
  const slaStart = new Date(ticket.createdAt).getTime()
  const slaEnd = new Date(ticket.slaDueAt).getTime()
  const slaPct =
    ticket.status === 'resolved'
      ? 100
      : Math.min(
          100,
          Math.max(0, Math.round(((now - slaStart) / Math.max(1, slaEnd - slaStart)) * 100)),
        )
  const slaBarClass = sla.breached
    ? 'bg-red-500'
    : ticket.status === 'resolved'
      ? 'bg-emerald-500'
      : sla.tone === 'warning'
        ? 'bg-amber-500'
        : 'bg-primary'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Detail</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground uppercase tracking-wide">
              Sisa waktu SLA
            </span>
            <span
              className={cn(
                'font-medium',
                sla.breached
                  ? 'text-red-600 dark:text-red-400'
                  : sla.tone === 'warning'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-muted-foreground',
              )}
            >
              {sla.label}
            </span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={slaPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Sisa waktu SLA"
          >
            <div
              className={cn('h-full rounded-full transition-all', slaBarClass)}
              style={{ width: `${Math.max(2, slaPct)}%` }}
            />
          </div>
        </div>
        <dl className="space-y-3 text-sm">
          <Row
            label="Pelanggan"
            value={
              ticket.customerId ? (
                <Link
                  to="/customers/$customerId"
                  params={{ customerId: ticket.customerId }}
                  className="hover:underline"
                >
                  {ticket.customerName}
                </Link>
              ) : (
                ticket.customerName
              )
            }
          />
          <Row label="Prioritas" value={statusLabel(ticket.priority)} />
          <Row label="Teknisi" value={ticket.assignee ?? '—'} />
          <Row label="Dibuat" value={formatDateTime(ticket.createdAt)} />
          <Row label="Batas SLA" value={formatDateTime(ticket.slaDueAt)} />
        </dl>
      </CardContent>
    </Card>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  )
}

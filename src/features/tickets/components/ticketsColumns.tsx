import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { ticketStatusTone as STATUS_TONE } from '@/components/shared/status-tone'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { formatDateTime } from '@/lib/format'
import { slaState } from '@/lib/sla'
import { statusLabel } from '@/lib/status-label'
import type { Ticket, TicketPriority } from '@/schemas/ticket'

import { TicketRowActions } from './TicketRowActions'

export const PRIORITY_TONE: Record<TicketPriority, StatusTone> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
}

export const toCsvRow = (t: Ticket) => ({
  Kode: t.code,
  Subjek: t.subject,
  Pelanggan: t.customerName,
  Prioritas: statusLabel(t.priority),
  Status: statusLabel(t.status),
  'Batas SLA': formatDateTime(t.slaDueAt),
})

// Static column defs (no component state): sortable keys (code/status) match
// the backend sort whitelist; the table delegates sorting to the server.
export const ticketColumns: ColumnDef<Ticket>[] = [
  {
    accessorKey: 'code',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kode" />,
    meta: { title: 'Kode' },
    cell: ({ row }) => (
      <Link
        to="/tickets/$ticketId"
        params={{ ticketId: row.original.id }}
        className="font-medium font-mono text-sm hover:underline"
      >
        {row.original.code}
      </Link>
    ),
  },
  {
    accessorKey: 'subject',
    header: 'Subjek',
    meta: { title: 'Subjek' },
    cell: ({ row }) => <span className="font-medium">{row.original.subject}</span>,
  },
  {
    accessorKey: 'customerName',
    header: 'Pelanggan',
    meta: { title: 'Pelanggan' },
    cell: ({ row }) =>
      row.original.customerId ? (
        <Link
          to="/customers/$customerId"
          params={{ customerId: row.original.customerId }}
          className="font-medium hover:underline"
        >
          {row.original.customerName}
        </Link>
      ) : (
        row.original.customerName
      ),
  },
  {
    accessorKey: 'priority',
    header: 'Prioritas',
    meta: { title: 'Prioritas' },
    cell: ({ row }) => (
      <StatusBadge
        tone={PRIORITY_TONE[row.original.priority]}
        label={statusLabel(row.original.priority)}
        dot={false}
      />
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    meta: { title: 'Status' },
    cell: ({ row }) => (
      <StatusBadge
        tone={STATUS_TONE[row.original.status]}
        label={statusLabel(row.original.status)}
      />
    ),
  },
  {
    id: 'sla',
    header: 'SLA',
    meta: { title: 'SLA' },
    cell: ({ row }) => {
      const sla = slaState(row.original.status, row.original.slaDueAt, Date.now())
      return (
        <div className="flex flex-col gap-0.5">
          <StatusBadge tone={sla.tone} label={sla.label} dot={!sla.breached} />
          <span className="text-muted-foreground text-xs">
            {formatDateTime(row.original.slaDueAt)}
          </span>
        </div>
      )
    },
  },
  {
    id: 'actions',
    meta: { align: 'right' },
    enableHiding: false,
    cell: ({ row }) => <TicketRowActions ticket={row.original} />,
  },
]

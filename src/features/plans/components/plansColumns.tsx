import type { ColumnDef } from '@tanstack/react-table'

import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { formatCurrency, formatNumber } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Plan, PlanStatus } from '@/schemas/plan'

import { PlanRowActions } from './PlanRowActions'

export const STATUS_TONE: Record<PlanStatus, StatusTone> = {
  active: 'success',
  archived: 'neutral',
}

const fupLabel = (fupGb: number | undefined) => (fupGb ? `${formatNumber(fupGb)} GB` : 'Unlimited')

export const toCsvRow = (p: Plan) => ({
  Paket: p.name,
  Kecepatan: `${p.speedMbps} Mbps`,
  Profil: p.rateLimitProfile ?? '',
  FUP: fupLabel(p.fupGb),
  Harga: formatCurrency(p.priceMonthly),
  Status: statusLabel(p.status),
})

// Static column defs (no component state): sortable keys (name/speedMbps/
// priceMonthly/status) match the backend sort whitelist. subscriberCount is
// derived from the customer base (no backing column server-side), so it is not
// a sortable column.
export const planColumns: ColumnDef<Plan>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Paket" />,
    meta: { title: 'Paket' },
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: 'speedMbps',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kecepatan" />,
    meta: { title: 'Kecepatan', align: 'right' },
    cell: ({ row }) => (
      <div className="text-right">
        <span className="font-mono tabular-nums">{formatNumber(row.original.speedMbps)} Mbps</span>
        {row.original.rateLimitProfile ? (
          <span className="block font-mono text-muted-foreground text-xs">
            {row.original.rateLimitProfile}
          </span>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: 'fupGb',
    header: 'FUP',
    meta: { title: 'FUP', align: 'right' },
    cell: ({ row }) =>
      row.original.fupGb ? (
        <span className="font-mono tabular-nums">{formatNumber(row.original.fupGb)} GB</span>
      ) : (
        <span className="text-muted-foreground">Unlimited</span>
      ),
  },
  {
    accessorKey: 'priceMonthly',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Harga / bulan" />,
    meta: { title: 'Harga / bulan', align: 'right' },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{formatCurrency(row.original.priceMonthly)}</span>
    ),
  },
  {
    accessorKey: 'subscriberCount',
    header: 'Pelanggan',
    meta: { title: 'Pelanggan', align: 'right' },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">
        {formatNumber(row.original.subscriberCount ?? 0)}
      </span>
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
    id: 'actions',
    meta: { align: 'right' },
    enableHiding: false,
    cell: ({ row }) => <PlanRowActions plan={row.original} />,
  },
]

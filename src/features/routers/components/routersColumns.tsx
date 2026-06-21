import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { formatDateTime, formatNumber } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Router, RouterStatus } from '@/schemas/router'

const STATUS_TONE: Record<RouterStatus, StatusTone> = {
  online: 'success',
  offline: 'danger',
}

export const toCsvRow = (r: Router) => ({
  Router: r.name,
  Alamat: r.address,
  Model: r.model,
  'Secret PPPoE': r.secretCount,
  'Sinkron terakhir': formatDateTime(r.lastSyncAt),
  Status: statusLabel(r.status),
})

// Static column defs (no component state). Sortable keys (name/secretCount/
// lastSyncAt/status) match the backend sort whitelist; secretCount is a real
// cached column server-side so it is sortable. Alamat/Model are plain headers.
export const routerColumns: ColumnDef<Router>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Router" />,
    meta: { title: 'Router' },
    cell: ({ row }) => (
      <Link
        to="/network/routers/$routerId"
        params={{ routerId: row.original.id }}
        className="font-medium hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: 'address',
    header: 'Alamat',
    meta: { title: 'Alamat' },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.address}</span>,
  },
  { accessorKey: 'model', header: 'Model', meta: { title: 'Model' } },
  {
    accessorKey: 'secretCount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Secret PPPoE" />,
    meta: { title: 'Secret PPPoE', align: 'right' },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{formatNumber(row.original.secretCount)}</span>
    ),
  },
  {
    accessorKey: 'lastSyncAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Sinkron terakhir" />,
    meta: { title: 'Sinkron terakhir' },
    cell: ({ row }) => formatDateTime(row.original.lastSyncAt),
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
]

import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { formatNumber } from '@/lib/format'
import type { DeviceMetric, MetricStatus } from '@/schemas/monitoring'

const METRIC_TONE: Record<MetricStatus, StatusTone> = {
  up: 'success',
  degraded: 'warning',
  down: 'danger',
}

export const METRIC_LABEL: Record<MetricStatus, string> = {
  up: 'Up',
  degraded: 'Menurun',
  down: 'Down',
}

// Static column defs (no component state): the device link + status badge are
// pure functions of the row.
export const monitoringColumns: ColumnDef<DeviceMetric>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Perangkat" />,
    meta: { title: 'Perangkat' },
    cell: ({ row }) => (
      <Link
        to="/network/devices/$deviceId"
        params={{ deviceId: row.original.deviceId }}
        className="font-medium hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Jenis',
    meta: { title: 'Jenis' },
    cell: ({ row }) => <span className="uppercase">{row.original.type}</span>,
  },
  { accessorKey: 'areaName', header: 'Area', meta: { title: 'Area' } },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    meta: { title: 'Status' },
    cell: ({ row }) => (
      <StatusBadge
        tone={METRIC_TONE[row.original.status]}
        label={METRIC_LABEL[row.original.status]}
      />
    ),
  },
  {
    accessorKey: 'uptimePct',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Uptime" />,
    meta: { title: 'Uptime', align: 'right' },
    cell: ({ row }) => <span className="font-mono tabular-nums">{row.original.uptimePct}%</span>,
  },
  {
    accessorKey: 'latencyMs',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Latensi" />,
    meta: { title: 'Latensi', align: 'right' },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{formatNumber(row.original.latencyMs)} ms</span>
    ),
  },
  {
    accessorKey: 'utilizationPct',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Utilisasi" />,
    meta: { title: 'Utilisasi', align: 'right' },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{row.original.utilizationPct}%</span>
    ),
  },
]

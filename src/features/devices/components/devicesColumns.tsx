import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { formatDateTime, formatNumber } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Device, DeviceStatus } from '@/schemas/device'

import { DeviceRowActions } from './DeviceRowActions'

export const STATUS_TONE: Record<DeviceStatus, StatusTone> = {
  online: 'success',
  degraded: 'warning',
  offline: 'danger',
}

// GPON optical health: healthy ≳ −25 dBm, marginal −25…−27, bad < −27.
function rxTone(dbm: number): StatusTone {
  if (dbm >= -25) return 'success'
  if (dbm >= -27) return 'warning'
  return 'danger'
}

export const toCsvRow = (d: Device) => ({
  Perangkat: d.name,
  Tipe: d.type.toUpperCase(),
  'Alamat IP': d.ipAddress,
  Area: d.areaName,
  Redaman: d.rxPower == null ? '—' : `${d.rxPower} dBm`,
  Uptime: `${Math.round(d.uptimeHours)} j`,
  'Terakhir terlihat': formatDateTime(d.lastSeenAt),
  Status: statusLabel(d.status),
})

// Static column defs (no component state): sortable keys (name/rxPower/
// uptimeHours/lastSeenAt/status) match the backend sort whitelist.
export const deviceColumns: ColumnDef<Device>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Perangkat" />,
    meta: { title: 'Perangkat' },
    cell: ({ row }) => (
      <Link
        to="/network/devices/$deviceId"
        params={{ deviceId: row.original.id }}
        className="font-medium hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Tipe',
    meta: { title: 'Tipe' },
    cell: ({ row }) => <span className="uppercase">{row.original.type}</span>,
  },
  {
    accessorKey: 'ipAddress',
    header: 'Alamat IP',
    meta: { title: 'Alamat IP' },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.ipAddress}</span>,
  },
  { accessorKey: 'areaName', header: 'Area', meta: { title: 'Area' } },
  {
    accessorKey: 'rxPower',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Redaman" />,
    meta: { title: 'Redaman', align: 'right' },
    cell: ({ row }) =>
      row.original.rxPower == null ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        <StatusBadge
          tone={rxTone(row.original.rxPower)}
          label={`${row.original.rxPower} dBm`}
          dot={false}
        />
      ),
  },
  {
    accessorKey: 'uptimeHours',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Uptime" />,
    meta: { title: 'Uptime', align: 'right' },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">
        {formatNumber(Math.round(row.original.uptimeHours))} j
      </span>
    ),
  },
  {
    accessorKey: 'lastSeenAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Terakhir terlihat" />,
    meta: { title: 'Terakhir terlihat' },
    cell: ({ row }) => formatDateTime(row.original.lastSeenAt),
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
    cell: ({ row }) => <DeviceRowActions device={row.original} />,
  },
]

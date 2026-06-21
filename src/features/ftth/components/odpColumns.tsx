import type { ColumnDef } from '@tanstack/react-table'

import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import type { OdpRecord, OdpStatus } from '@/schemas/odp'

const STATUS_TONE: Record<OdpStatus, StatusTone> = {
  healthy: 'success',
  warning: 'warning',
  critical: 'danger',
}

const STATUS_LABEL: Record<OdpStatus, string> = {
  healthy: 'Sehat',
  warning: 'Perhatian',
  critical: 'Kritis',
}

const free = (o: OdpRecord) => o.totalPorts - o.usedPorts

export const toCsvRow = (o: OdpRecord) => ({
  ODP: o.name,
  Area: o.area,
  Splitter: o.splitter,
  Port: `${o.usedPorts}/${o.totalPorts}`,
  'Slot kosong': free(o),
  'Redaman (dBm)': o.avgRxPowerDbm,
  Status: STATUS_LABEL[o.status],
})

// Static column defs (no component state). Sortable keys (name/usedPorts/
// avgRxPowerDbm) match the backend sort whitelist; the rest are plain.
export const odpColumns: ColumnDef<OdpRecord>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="ODP" />,
    meta: { title: 'ODP' },
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  { accessorKey: 'area', header: 'Area', meta: { title: 'Area' } },
  {
    accessorKey: 'splitter',
    header: 'Splitter',
    meta: { title: 'Splitter' },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.splitter}</span>,
  },
  {
    accessorKey: 'usedPorts',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kapasitas port" />,
    meta: { title: 'Kapasitas port' },
    cell: ({ row }) => {
      const { usedPorts, totalPorts } = row.original
      const p = Math.round((usedPorts / totalPorts) * 100)
      return (
        <div className="w-36">
          <div className="flex justify-between text-xs">
            <span className="font-mono tabular-nums">
              {usedPorts}/{totalPorts}
            </span>
            <span className="text-muted-foreground">{p}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${p >= 100 ? 'bg-red-500' : p >= 80 ? 'bg-amber-500' : 'bg-primary'}`}
              style={{ width: `${Math.max(2, p)}%` }}
            />
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'avgRxPowerDbm',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Redaman" />,
    meta: { title: 'Redaman', align: 'right' },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{row.original.avgRxPowerDbm} dBm</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Optik',
    meta: { title: 'Optik' },
    cell: ({ row }) => (
      <StatusBadge
        tone={STATUS_TONE[row.original.status]}
        label={STATUS_LABEL[row.original.status]}
      />
    ),
  },
]

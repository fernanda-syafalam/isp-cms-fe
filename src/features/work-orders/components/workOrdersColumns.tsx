import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { StatusBadge } from '@/components/shared/status-badge'
import { workOrderStatusTone as STATUS_TONE } from '@/components/shared/status-tone'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { formatDateTime } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { WorkOrder } from '@/schemas/workorder'

import { WorkOrderRowActions } from './WorkOrderRowActions'

export const toCsvRow = (w: WorkOrder) => ({
  Kode: w.code,
  Jenis: statusLabel(w.type),
  Pelanggan: w.customerName,
  Teknisi: w.technician ?? '—',
  Jadwal: formatDateTime(w.scheduledAt),
  Status: statusLabel(w.status),
})

// Static column defs (no component state): sortable keys (code/scheduledAt/
// status) match the backend sort whitelist.
export const workOrderColumns: ColumnDef<WorkOrder>[] = [
  {
    accessorKey: 'code',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kode" />,
    meta: { title: 'Kode' },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.code}</span>,
  },
  {
    accessorKey: 'type',
    header: 'Jenis',
    meta: { title: 'Jenis' },
    cell: ({ row }) => statusLabel(row.original.type),
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
    accessorKey: 'technician',
    header: 'Teknisi',
    meta: { title: 'Teknisi' },
    cell: ({ row }) => row.original.technician ?? '—',
  },
  {
    accessorKey: 'scheduledAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Jadwal" />,
    meta: { title: 'Jadwal' },
    cell: ({ row }) => formatDateTime(row.original.scheduledAt),
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
    cell: ({ row }) => <WorkOrderRowActions workOrder={row.original} />,
  },
]

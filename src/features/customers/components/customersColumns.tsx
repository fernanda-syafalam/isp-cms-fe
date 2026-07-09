import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { StatusBadge } from '@/components/shared/status-badge'
import { customerStatusTone as STATUS_TONE } from '@/components/shared/status-tone'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { formatDate } from '@/lib/format'
import { customerStatusLabel } from '@/lib/status-label'
import type { Customer, CustomerStatus } from '@/schemas/customer'

import { CustomerRowActions } from './CustomerRowActions'

export const STATUS_LABEL: Record<CustomerStatus, string> = {
  prospek: 'Prospek',
  instalasi: 'Instalasi',
  aktif: 'Aktif',
  isolir: 'Isolir',
  berhenti: 'Berhenti',
}

export const toCsvRow = (c: Customer) => ({
  No: c.customerNo,
  Nama: c.fullName,
  Telepon: c.phone,
  Area: c.areaName ?? '',
  Paket: c.planName,
  Status: customerStatusLabel(c.status, c.holdReason),
  Bergabung: formatDate(c.joinedAt),
})

// Column defs (no component state of their own). Sortable keys (customerNo/
// fullName/areaName/status/joinedAt) match the backend sort whitelist; phone is
// plain. A factory rather than a const so the row-actions menu can receive the
// page's `onQuickView` callback, giving keyboard users a focusable trigger for
// the quick-view drawer (the row `<tr>` click that opens it is mouse-only).
export const customerColumns = (
  onQuickView: (customer: Customer) => void,
): ColumnDef<Customer>[] => [
  {
    accessorKey: 'customerNo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="No." />,
    meta: { title: 'No.' },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.customerNo}</span>,
  },
  {
    accessorKey: 'fullName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nama" />,
    meta: { title: 'Nama' },
    cell: ({ row }) => (
      <Link
        to="/customers/$customerId"
        params={{ customerId: row.original.id }}
        className="font-medium hover:underline"
      >
        {row.original.fullName}
      </Link>
    ),
  },
  { accessorKey: 'phone', header: 'Telepon', meta: { title: 'Telepon' } },
  {
    accessorKey: 'areaName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Area" />,
    meta: { title: 'Area' },
    cell: ({ row }) => row.original.areaName ?? <span className="text-muted-foreground">—</span>,
  },
  { accessorKey: 'planName', header: 'Paket', meta: { title: 'Paket' } },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    meta: { title: 'Status' },
    cell: ({ row }) => (
      <StatusBadge
        tone={STATUS_TONE[row.original.status]}
        label={customerStatusLabel(row.original.status, row.original.holdReason)}
      />
    ),
  },
  {
    accessorKey: 'joinedAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Bergabung" />,
    meta: { title: 'Bergabung' },
    cell: ({ row }) => formatDate(row.original.joinedAt),
  },
  {
    id: 'actions',
    meta: { align: 'right' },
    enableHiding: false,
    cell: ({ row }) => (
      <CustomerRowActions customer={row.original} onQuickView={() => onQuickView(row.original)} />
    ),
  },
]

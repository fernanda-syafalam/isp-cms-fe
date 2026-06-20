import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { formatDate } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Customer, CustomerStatus } from '@/schemas/customer'

import { CustomerRowActions } from './CustomerRowActions'

export const STATUS_TONE: Record<CustomerStatus, StatusTone> = {
  prospek: 'neutral',
  instalasi: 'info',
  aktif: 'success',
  isolir: 'danger',
  berhenti: 'neutral',
}

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
  Status: statusLabel(c.status),
  Bergabung: formatDate(c.joinedAt),
})

// Static column defs (no component state). Sortable keys (customerNo/fullName/
// areaName/status/joinedAt) match the backend sort whitelist; phone is plain.
export const customerColumns: ColumnDef<Customer>[] = [
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
        label={STATUS_LABEL[row.original.status]}
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
    cell: ({ row }) => <CustomerRowActions customer={row.original} />,
  },
]

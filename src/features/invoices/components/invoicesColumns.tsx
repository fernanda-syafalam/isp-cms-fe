import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { StatusBadge } from '@/components/shared/status-badge'
import { invoiceStatusTone as STATUS_TONE } from '@/components/shared/status-tone'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { formatCurrency, formatDate } from '@/lib/format'
import { invoiceTotal } from '@/lib/invoice'
import { statusLabel } from '@/lib/status-label'
import type { Invoice } from '@/schemas/invoice'

export const toCsvRow = (inv: Invoice) => ({
  'No. Tagihan': inv.invoiceNo,
  Pelanggan: inv.customerName,
  DPP: formatCurrency(inv.amount),
  PPN: formatCurrency(inv.taxAmount),
  Jumlah: formatCurrency(invoiceTotal(inv)),
  'Jatuh tempo': formatDate(inv.dueDate),
  Status: statusLabel(inv.status),
  Pengingat: inv.lastRemindedAt ? formatDate(inv.lastRemindedAt) : '—',
})

// Static column defs (no component state). Sortable keys (invoiceNo/amount/
// dueDate/status/lastRemindedAt) match the backend sort whitelist; Pelanggan is
// a plain header.
export const invoiceColumns: ColumnDef<Invoice>[] = [
  {
    accessorKey: 'invoiceNo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="No. Tagihan" />,
    meta: { title: 'No. Tagihan' },
    cell: ({ row }) => (
      <Link
        to="/invoices/$invoiceId"
        params={{ invoiceId: row.original.id }}
        className="font-medium font-mono text-sm hover:underline"
      >
        {row.original.invoiceNo}
      </Link>
    ),
  },
  {
    accessorKey: 'customerName',
    header: 'Pelanggan',
    meta: { title: 'Pelanggan' },
    cell: ({ row }) => (
      <Link
        to="/customers/$customerId"
        params={{ customerId: row.original.customerId }}
        className="font-medium hover:underline"
      >
        {row.original.customerName}
      </Link>
    ),
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Jumlah" />,
    meta: { title: 'Jumlah', align: 'right' },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{formatCurrency(invoiceTotal(row.original))}</span>
    ),
  },
  {
    accessorKey: 'dueDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Jatuh tempo" />,
    meta: { title: 'Jatuh tempo' },
    cell: ({ row }) => formatDate(row.original.dueDate),
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
    accessorKey: 'lastRemindedAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pengingat" />,
    meta: { title: 'Pengingat' },
    cell: ({ row }) =>
      row.original.lastRemindedAt ? (
        <span className="text-muted-foreground text-sm">
          {formatDate(row.original.lastRemindedAt)}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
]

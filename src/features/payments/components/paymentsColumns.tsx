import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Payment, PaymentMethod } from '@/schemas/payment'

const METHOD_TONE: Record<PaymentMethod, StatusTone> = {
  qris: 'info',
  va: 'info',
  ewallet: 'info',
  transfer: 'info',
  cash: 'neutral',
}

export const toCsvRow = (p: Payment) => ({
  Tanggal: formatDateTime(p.paidAt),
  Tagihan: p.invoiceNo,
  Pelanggan: p.customerName,
  Metode: statusLabel(p.method),
  Jumlah: formatCurrency(p.amount),
})

// Static column defs (no component state): sortable keys (paidAt/invoiceNo/
// amount) match the backend sort whitelist; the table delegates sorting.
export const paymentColumns: ColumnDef<Payment>[] = [
  {
    accessorKey: 'paidAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
    meta: { title: 'Tanggal' },
    cell: ({ row }) => formatDateTime(row.original.paidAt),
  },
  {
    accessorKey: 'invoiceNo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tagihan" />,
    meta: { title: 'Tagihan' },
    cell: ({ row }) => (
      <Link
        to="/invoices/$invoiceId"
        params={{ invoiceId: row.original.invoiceId }}
        className="font-mono text-sm hover:underline"
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
    accessorKey: 'method',
    header: 'Metode',
    meta: { title: 'Metode' },
    cell: ({ row }) => (
      <StatusBadge
        tone={METHOD_TONE[row.original.method]}
        label={statusLabel(row.original.method)}
        dot={false}
      />
    ),
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Jumlah" />,
    meta: { title: 'Jumlah', align: 'right' },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{formatCurrency(row.original.amount)}</span>
    ),
  },
]

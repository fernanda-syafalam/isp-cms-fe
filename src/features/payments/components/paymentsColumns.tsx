import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Payment, PaymentMethod, PaymentSource } from '@/schemas/payment'

const METHOD_TONE: Record<PaymentMethod, StatusTone> = {
  qris: 'info',
  va: 'info',
  ewallet: 'info',
  transfer: 'info',
  cash: 'neutral',
}

// Source of a payment: settling an invoice, or redeeming a prepaid voucher.
const SOURCE_LABEL: Record<PaymentSource, string> = {
  invoice: 'Tagihan',
  voucher: 'Voucher',
}
const SOURCE_TONE: Record<PaymentSource, StatusTone> = {
  invoice: 'neutral',
  voucher: 'info',
}

export const toCsvRow = (p: Payment) => ({
  Tanggal: formatDateTime(p.paidAt),
  Sumber: SOURCE_LABEL[p.source],
  Tagihan: p.invoiceNo ?? '—',
  Pelanggan: p.customerName ?? 'Anonim',
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
    // A voucher settlement has no invoice — show its source badge instead of a
    // dead link.
    cell: ({ row }) =>
      row.original.invoiceId && row.original.invoiceNo ? (
        <Link
          to="/invoices/$invoiceId"
          params={{ invoiceId: row.original.invoiceId }}
          className="font-mono text-sm hover:underline"
        >
          {row.original.invoiceNo}
        </Link>
      ) : (
        <StatusBadge
          tone={SOURCE_TONE[row.original.source]}
          label={SOURCE_LABEL[row.original.source]}
          dot={false}
        />
      ),
  },
  {
    accessorKey: 'customerName',
    header: 'Pelanggan',
    meta: { title: 'Pelanggan' },
    // Null customer (anonymous voucher redemption) renders plain text, no link.
    cell: ({ row }) =>
      row.original.customerId && row.original.customerName ? (
        <Link
          to="/customers/$customerId"
          params={{ customerId: row.original.customerId }}
          className="font-medium hover:underline"
        >
          {row.original.customerName}
        </Link>
      ) : (
        <span className="text-muted-foreground">Anonim</span>
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

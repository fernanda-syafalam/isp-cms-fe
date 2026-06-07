import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { DownloadIcon } from 'lucide-react'
import { useMemo } from 'react'

import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { downloadCsv } from '@/lib/csv'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Payment, PaymentMethod } from '@/schemas/payment'

import { usePaymentsList } from '../hooks/usePayments'

const METHOD_TONE: Record<PaymentMethod, StatusTone> = {
  qris: 'info',
  va: 'info',
  ewallet: 'info',
  transfer: 'info',
  cash: 'neutral',
}

const toCsvRow = (p: Payment) => ({
  Tanggal: formatDateTime(p.paidAt),
  Tagihan: p.invoiceNo,
  Pelanggan: p.customerName,
  Metode: statusLabel(p.method),
  Jumlah: formatCurrency(p.amount),
})

export function PaymentsListPage() {
  const { data, isLoading, isError } = usePaymentsList()

  const columns = useMemo<ColumnDef<Payment>[]>(
    () => [
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
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Pembayaran" description="Riwayat pembayaran tagihan pelanggan." />
      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada pembayaran."
        searchPlaceholder="Cari pembayaran…"
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={!data?.items.length}
            onClick={() => downloadCsv('pembayaran', (data?.items ?? []).map(toCsvRow))}
          >
            <DownloadIcon className="size-4" />
            <span className="hidden sm:inline">Ekspor</span>
          </Button>
        }
      />
    </div>
  )
}

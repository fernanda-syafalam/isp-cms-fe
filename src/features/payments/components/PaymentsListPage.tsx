import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'

import { DataTable } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
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

export function PaymentsListPage() {
  const { data, isLoading, isError } = usePaymentsList()

  const columns = useMemo<ColumnDef<Payment>[]>(
    () => [
      {
        accessorKey: 'paidAt',
        header: 'Tanggal',
        cell: ({ row }) => formatDateTime(row.original.paidAt),
      },
      {
        accessorKey: 'invoiceNo',
        header: 'Tagihan',
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.invoiceNo}</span>,
      },
      { accessorKey: 'customerName', header: 'Pelanggan' },
      {
        accessorKey: 'method',
        header: 'Metode',
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
        header: 'Jumlah',
        meta: { align: 'right' },
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
      <div className="rounded-lg border border-border bg-card p-4">
        <DataTable
          columns={columns}
          data={data?.items}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="Belum ada pembayaran."
        />
      </div>
    </div>
  )
}

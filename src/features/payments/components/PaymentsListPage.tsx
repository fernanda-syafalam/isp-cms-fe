import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { DownloadIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { PaymentFilter } from '@/api/payments'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Payment, PaymentMethod } from '@/schemas/payment'

import { useExportPayments, usePaymentsList } from '../hooks/usePayments'

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

// Static column defs (no component state): sortable keys (paidAt/invoiceNo/
// amount) match the backend sort whitelist; the table delegates sorting.
const COLUMNS: ColumnDef<Payment>[] = [
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

export function PaymentsListPage() {
  const table = useTableQuery({ pageSize: 20 })
  const exportPayments = useExportPayments()
  const [isExporting, setIsExporting] = useState(false)

  // Search/sort/paging come entirely from the table (no equality filter here).
  const baseFilter: PaymentFilter = {
    q: table.params.q,
    sort: table.params.sort,
    order: table.params.order,
  }
  const { data, isLoading, isError, refetch } = usePaymentsList({
    ...baseFilter,
    limit: table.params.limit,
    offset: table.params.offset,
  })
  const total = data?.total ?? 0

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportPayments(baseFilter)
      downloadCsv('pembayaran', result.items.map(toCsvRow))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Pembayaran" description="Riwayat pembayaran tagihan pelanggan." />
      <DataTable
        columns={COLUMNS}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyMessage="Belum ada pembayaran."
        searchPlaceholder="Cari pembayaran…"
        server={{
          pageIndex: table.pageIndex,
          pageSize: table.pageSize,
          rowCount: total,
          sorting: table.sorting,
          search: table.search,
          onPaginationChange: table.onPaginationChange,
          onSortingChange: table.onSortingChange,
          onSearchChange: table.onSearchChange,
        }}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={!total || isExporting}
            onClick={handleExport}
          >
            <DownloadIcon className="size-4" />
            <span className="hidden sm:inline">Ekspor</span>
          </Button>
        }
      />
    </div>
  )
}

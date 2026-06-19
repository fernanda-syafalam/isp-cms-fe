import { Link, getRouteApi } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { DownloadIcon, LandmarkIcon, QrCodeIcon, ReceiptTextIcon, WalletIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { PaymentFilter } from '@/api/payments'
import { FilterTabs, type FilterTabItem } from '@/components/shared/filter-tabs'
import { KpiCard } from '@/components/shared/kpi-card'
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
import { PaymentDetailSheet } from './PaymentDetailSheet'

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

const routeApi = getRouteApi('/_auth/payments')

export function PaymentsListPage() {
  const { method: methodParam } = routeApi.useSearch()
  const method = methodParam ?? 'all'
  const navigate = routeApi.useNavigate()
  const table = useTableQuery({ pageSize: 20 })
  const exportPayments = useExportPayments()
  const [isExporting, setIsExporting] = useState(false)
  const [openPayment, setOpenPayment] = useState<Payment | null>(null)

  // Method is a URL filter (deep-linkable); changing it rewinds to page 1.
  const setMethod = (value: string) => {
    table.resetPage()
    navigate({ search: value === 'all' ? {} : { method: value } })
  }

  const baseFilter: PaymentFilter = {
    ...(method === 'all' ? {} : { method }),
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
  const summary = data?.summary
  const by = summary?.byMethod

  const methodTabs: FilterTabItem[] = [
    { value: 'all', label: 'Semua', count: summary?.total },
    { value: 'qris', label: statusLabel('qris'), count: by?.qris },
    { value: 'va', label: statusLabel('va'), count: by?.va },
    { value: 'ewallet', label: statusLabel('ewallet'), count: by?.ewallet },
    { value: 'transfer', label: statusLabel('transfer'), count: by?.transfer },
    { value: 'cash', label: statusLabel('cash'), count: by?.cash },
  ]

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
      <PageHeader
        title="Pembayaran"
        description="Riwayat pembayaran tagihan pelanggan."
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total diterima"
          value={formatCurrency(summary?.totalAmount ?? 0)}
          hint="seluruh pembayaran"
          icon={WalletIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Transaksi"
          value={summary?.total ?? 0}
          hint="jumlah pembayaran"
          icon={ReceiptTextIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="QRIS"
          value={by?.qris ?? 0}
          hint="via QRIS"
          icon={QrCodeIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Virtual Account"
          value={by?.va ?? 0}
          hint="via VA"
          icon={LandmarkIcon}
          isLoading={isLoading}
          isError={isError}
        />
      </div>

      <FilterTabs
        ariaLabel="Filter metode pembayaran"
        value={method}
        onValueChange={setMethod}
        items={methodTabs}
      />

      <DataTable
        columns={COLUMNS}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        onRowClick={(p) => setOpenPayment(p)}
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
      />

      <PaymentDetailSheet
        payment={openPayment}
        open={openPayment !== null}
        onOpenChange={(open) => {
          if (!open) setOpenPayment(null)
        }}
      />
    </div>
  )
}

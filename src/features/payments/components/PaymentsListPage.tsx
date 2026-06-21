import { getRouteApi } from '@tanstack/react-router'
import { DownloadIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { PaymentFilter } from '@/api/payments'
import { FilterTabs, type FilterTabItem } from '@/components/shared/filter-tabs'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/table/data-table'
import { Button } from '@/components/ui/button'
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'
import { statusLabel } from '@/lib/status-label'
import type { Payment } from '@/schemas/payment'

import { useExportPayments, usePaymentsList } from '../hooks/usePayments'
import { paymentColumns, toCsvRow } from './paymentsColumns'
import { PaymentDetailSheet } from './PaymentDetailSheet'
import { PaymentsKpis } from './PaymentsKpis'

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

      <PaymentsKpis summary={summary} isLoading={isLoading} isError={isError} />

      <FilterTabs
        ariaLabel="Filter metode pembayaran"
        value={method}
        onValueChange={setMethod}
        items={methodTabs}
      />

      <DataTable
        columns={paymentColumns}
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

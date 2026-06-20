import { getRouteApi } from '@tanstack/react-router'
import { BellRingIcon, DownloadIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { InvoiceFilter } from '@/api/invoices'
import { FilterTabs, type FilterTabItem } from '@/components/shared/filter-tabs'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/table/data-table'
import { Button } from '@/components/ui/button'
import { useCan } from '@/features/auth'
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'
import { statusLabel } from '@/lib/status-label'

import { useRemindOverdue } from '../hooks/useBilling'
import { useExportInvoices, useInvoicesList } from '../hooks/useInvoices'
import { BillingActions } from './BillingActions'
import { InvoiceDetailSheet } from './InvoiceDetailSheet'
import { invoiceColumns, toCsvRow } from './invoicesColumns'
import { InvoicesKpis } from './InvoicesKpis'

const routeApi = getRouteApi('/_auth/invoices/')

export function InvoicesListPage() {
  const { status: statusParam } = routeApi.useSearch()
  const status = statusParam ?? 'all'
  const navigate = routeApi.useNavigate()
  const canRemind = useCan('billing.run')
  const remind = useRemindOverdue()
  const table = useTableQuery({ pageSize: 20 })
  const exportInvoices = useExportInvoices()
  const [isExporting, setIsExporting] = useState(false)
  const [openInvoiceId, setOpenInvoiceId] = useState<string | null>(null)

  // Status is a URL filter the table does not own — rewind to page 1 on change.
  const setStatus = (value: string) => {
    navigate({ search: value === 'all' ? {} : { status: value } })
    table.resetPage()
  }

  const baseFilter: InvoiceFilter = {
    status: status === 'all' ? undefined : status,
    q: table.params.q,
    sort: table.params.sort,
    order: table.params.order,
  }
  const { data, isLoading, isError, refetch } = useInvoicesList({
    ...baseFilter,
    limit: table.params.limit,
    offset: table.params.offset,
  })
  const total = data?.total ?? 0
  // AR summary is a full-set server aggregate (ignores status/q/paging), so the
  // KPI cards + status tabs stay correct under any table filter.
  const summary = data?.summary
  const by = summary?.byStatus

  const statusTabs: FilterTabItem[] = [
    { value: 'all', label: 'Semua', count: summary?.total },
    { value: 'paid', label: statusLabel('paid'), count: by?.paid },
    { value: 'pending', label: statusLabel('pending'), count: by?.pending },
    { value: 'overdue', label: statusLabel('overdue'), count: by?.overdue },
    { value: 'draft', label: statusLabel('draft'), count: by?.draft },
  ]

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportInvoices(baseFilter)
      downloadCsv('tagihan', result.items.map(toCsvRow))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tagihan"
        description="Penagihan bulanan & piutang (AR)."
        actions={
          <>
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
            <BillingActions />
          </>
        }
      />

      <InvoicesKpis summary={summary} />

      <FilterTabs
        ariaLabel="Filter status tagihan"
        value={status}
        onValueChange={setStatus}
        items={statusTabs}
      />

      <DataTable
        columns={invoiceColumns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        onRowClick={(inv) => setOpenInvoiceId(inv.id)}
        emptyMessage={
          table.search ? `Tidak ada tagihan cocok dengan "${table.search}".` : 'Belum ada tagihan.'
        }
        searchPlaceholder="Cari tagihan…"
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
        enableSelection={canRemind}
        bulkActions={(selected) => {
          const unpaid = selected.filter(
            (inv) => inv.status === 'pending' || inv.status === 'overdue',
          )
          return (
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={remind.isPending || unpaid.length === 0}
              onClick={() => remind.mutate(unpaid.map((inv) => inv.id))}
            >
              <BellRingIcon className="size-4" />
              Kirim pengingat ({unpaid.length})
            </Button>
          )
        }}
      />

      <InvoiceDetailSheet
        invoiceId={openInvoiceId}
        open={openInvoiceId !== null}
        onOpenChange={(open) => {
          if (!open) setOpenInvoiceId(null)
        }}
      />
    </div>
  )
}

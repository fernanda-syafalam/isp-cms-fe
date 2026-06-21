import { getRouteApi } from '@tanstack/react-router'
import { DownloadIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { UsageFilter } from '@/api/usage'
import { FilterTabs, type FilterTabItem } from '@/components/shared/filter-tabs'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/table/data-table'
import { Button } from '@/components/ui/button'
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'
import type { UsageRecord } from '@/schemas/usage'

import { useExportUsage, useUsageList } from '../hooks/useUsage'
import { UsageDetailSheet } from './UsageDetailSheet'
import { usageColumns, toCsvRow } from './usageColumns'
import { UsageKpis } from './UsageKpis'

const routeApi = getRouteApi('/_auth/network/usage')

export function UsagePage() {
  const { status: statusParam } = routeApi.useSearch()
  const status = statusParam ?? 'all'
  const navigate = routeApi.useNavigate()
  const table = useTableQuery({ pageSize: 20 })
  const exportUsage = useExportUsage()
  const [isExporting, setIsExporting] = useState(false)
  const [openUsage, setOpenUsage] = useState<UsageRecord | null>(null)

  // FUP-state filter (normal / throttled) in the URL; rewinds to page 1.
  const setStatus = (value: string) => {
    navigate({ search: value === 'all' ? {} : { status: value } })
    table.resetPage()
  }

  const baseFilter: UsageFilter = {
    ...(status === 'all' ? {} : { status }),
    q: table.params.q,
    sort: table.params.sort,
    order: table.params.order,
  }
  const { data, isLoading, isError } = useUsageList({
    ...baseFilter,
    limit: table.params.limit,
    offset: table.params.offset,
  })
  const total = data?.total ?? 0
  // Full-set server aggregate (ignores q/sort/paging), so the KPI cards stay
  // correct under any table search.
  const summary = data?.summary

  const statusTabs: FilterTabItem[] = [
    { value: 'all', label: 'Semua', count: summary?.total },
    {
      value: 'normal',
      label: 'Normal',
      count: summary ? summary.total - summary.throttled : undefined,
    },
    { value: 'throttled', label: 'FUP', count: summary?.throttled },
  ]

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportUsage(baseFilter)
      downloadCsv('pemakaian', result.items.map(toCsvRow))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pemakaian & FUP"
        description="Konsumsi data per pelanggan periode berjalan (dari akunting RADIUS)."
      />

      <UsageKpis summary={summary} isLoading={isLoading} isError={isError} />

      <FilterTabs
        ariaLabel="Filter status FUP"
        value={status}
        onValueChange={setStatus}
        items={statusTabs}
      />

      <DataTable
        columns={usageColumns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        onRowClick={(u) => setOpenUsage(u)}
        emptyMessage={
          table.search
            ? `Tidak ada data pemakaian cocok dengan "${table.search}".`
            : 'Belum ada data pemakaian.'
        }
        searchPlaceholder="Cari pelanggan / paket…"
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

      <UsageDetailSheet
        record={openUsage}
        open={openUsage !== null}
        onOpenChange={(open) => {
          if (!open) setOpenUsage(null)
        }}
      />
    </div>
  )
}

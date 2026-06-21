import { DownloadIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { OdpFilter, OdpView } from '@/api/odp'
import { FilterTabs, type FilterTabItem } from '@/components/shared/filter-tabs'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/table/data-table'
import { Button } from '@/components/ui/button'
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'

import { useExportOdp, useOdpList } from '../hooks/useOdp'
import { odpColumns, toCsvRow } from './odpColumns'
import { OdpKpis } from './OdpKpis'

// 'all' has no server view param; the rest map straight to the `view` query.
const FILTERS = ['all', 'available', 'full', 'optical'] as const
type Filter = (typeof FILTERS)[number]
const FILTER_LABEL: Record<Filter, string> = {
  all: 'Semua ODP',
  available: 'Ada slot kosong',
  full: 'Penuh',
  optical: 'Optik bermasalah',
}

export function OdpPage() {
  const table = useTableQuery({ pageSize: 20 })
  const exportOdp = useExportOdp()
  const [filter, setFilter] = useState<Filter>('all')
  const [isExporting, setIsExporting] = useState(false)

  // The capacity/health view is a local filter the table does not own — rewind
  // to page 1 on change so the user is never stranded on an out-of-range page.
  const setView = (value: string) => {
    setFilter(value as Filter)
    table.resetPage()
  }

  const baseFilter: OdpFilter = {
    view: filter === 'all' ? undefined : (filter as OdpView),
    q: table.params.q,
    sort: table.params.sort,
    order: table.params.order,
  }
  const { data, isLoading, isError } = useOdpList({
    ...baseFilter,
    limit: table.params.limit,
    offset: table.params.offset,
  })
  const total = data?.total ?? 0
  // KPI summary is a full-set server aggregate (ignores view/q/paging), so the
  // cards stay correct under any table filter.
  const summary = data?.summary

  const viewTabs: FilterTabItem[] = [
    { value: 'all', label: FILTER_LABEL.all, count: summary?.totalOdp },
    {
      value: 'available',
      label: FILTER_LABEL.available,
      count: summary?.available,
    },
    { value: 'full', label: FILTER_LABEL.full, count: summary?.full },
    { value: 'optical', label: FILTER_LABEL.optical, count: summary?.optical },
  ]

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportOdp(baseFilter)
      downloadCsv('odp', result.items.map(toCsvRow))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="FTTH / ODP"
        description="Kapasitas port ODP & kesehatan optik (redaman) untuk perencanaan instalasi."
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

      <OdpKpis summary={summary} isLoading={isLoading} isError={isError} />

      <FilterTabs
        ariaLabel="Filter kapasitas / kesehatan ODP"
        value={filter}
        onValueChange={setView}
        items={viewTabs}
      />

      <DataTable
        columns={odpColumns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage={
          table.search ? `Tidak ada ODP cocok dengan "${table.search}".` : 'Tidak ada ODP.'
        }
        searchPlaceholder="Cari ODP / area…"
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
    </div>
  )
}

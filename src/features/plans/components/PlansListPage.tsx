import { getRouteApi } from '@tanstack/react-router'
import { DownloadIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { PlanFilter } from '@/api/plans'
import { FilterTabs, type FilterTabItem } from '@/components/shared/filter-tabs'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/table/data-table'
import { Button } from '@/components/ui/button'
import { useCan } from '@/features/auth'
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'
import { statusLabel } from '@/lib/status-label'

import { useExportPlans, usePlansList } from '../hooks/usePlans'
import { CreatePlanDialog } from './CreatePlanDialog'
import { planColumns, toCsvRow } from './plansColumns'
import { PlansKpis } from './PlansKpis'

const routeApi = getRouteApi('/_auth/plans')

export function PlansListPage() {
  const canManage = useCan('plans.manage')
  const { status: statusParam } = routeApi.useSearch()
  const status = statusParam ?? 'all'
  const navigate = routeApi.useNavigate()
  const table = useTableQuery({ pageSize: 20 })
  const exportPlans = useExportPlans()
  const [isExporting, setIsExporting] = useState(false)

  // Status is a URL filter (deep-linkable); changing it rewinds to page 1.
  const setStatus = (value: string) => {
    table.resetPage()
    navigate({ search: value === 'all' ? {} : { status: value } })
  }

  const baseFilter: PlanFilter = {
    ...(status === 'all' ? {} : { status }),
    q: table.params.q,
    sort: table.params.sort,
    order: table.params.order,
  }
  const { data, isLoading, isError, refetch } = usePlansList({
    ...baseFilter,
    limit: table.params.limit,
    offset: table.params.offset,
  })
  const total = data?.total ?? 0
  const summary = data?.summary
  const by = summary?.byStatus

  const statusTabs: FilterTabItem[] = [
    { value: 'all', label: 'Semua', count: summary?.total },
    { value: 'active', label: statusLabel('active'), count: by?.active },
    { value: 'archived', label: statusLabel('archived'), count: by?.archived },
  ]

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportPlans(baseFilter)
      downloadCsv('paket', result.items.map(toCsvRow))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paket Layanan"
        description="Paket internet untuk pelanggan."
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
            {canManage ? <CreatePlanDialog /> : null}
          </>
        }
      />

      <PlansKpis summary={summary} isLoading={isLoading} isError={isError} />

      <FilterTabs
        ariaLabel="Filter status paket"
        value={status}
        onValueChange={setStatus}
        items={statusTabs}
      />

      <DataTable
        columns={planColumns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyMessage="Belum ada paket."
        searchPlaceholder="Cari paket…"
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

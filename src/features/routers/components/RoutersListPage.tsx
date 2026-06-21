import { getRouteApi } from '@tanstack/react-router'
import { DownloadIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { RouterFilter } from '@/api/routers'
import { FilterTabs, type FilterTabItem } from '@/components/shared/filter-tabs'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/table/data-table'
import { Button } from '@/components/ui/button'
import { useCan } from '@/features/auth'
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'

import { useExportRouters, useRoutersList } from '../hooks/useRouters'
import { ConnectRouterDialog } from './ConnectRouterDialog'
import { routerColumns, toCsvRow } from './routersColumns'
import { RoutersKpis } from './RoutersKpis'

const routeApi = getRouteApi('/_auth/network/routers/')

export function RoutersListPage() {
  const canManage = useCan('network.manage')
  const { status: statusParam } = routeApi.useSearch()
  const status = statusParam ?? 'all'
  const navigate = routeApi.useNavigate()
  const table = useTableQuery({ pageSize: 20 })
  const exportRouters = useExportRouters()
  const [connectOpen, setConnectOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Status is a URL filter; changing it rewinds to page 1.
  const setStatus = (value: string) => {
    navigate({ search: value === 'all' ? {} : { status: value } })
    table.resetPage()
  }

  const baseFilter: RouterFilter = {
    ...(status === 'all' ? {} : { status }),
    q: table.params.q,
    sort: table.params.sort,
    order: table.params.order,
  }
  const { data, isLoading, isError } = useRoutersList({
    ...baseFilter,
    limit: table.params.limit,
    offset: table.params.offset,
  })
  const total = data?.total ?? 0
  const summary = data?.summary
  const by = summary?.byStatus

  const statusTabs: FilterTabItem[] = [
    { value: 'all', label: 'Semua', count: summary?.total },
    { value: 'online', label: 'Online', count: by?.online },
    { value: 'offline', label: 'Offline', count: by?.offline },
  ]

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportRouters(baseFilter)
      downloadCsv('router', result.items.map(toCsvRow))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Router (Mikrotik)"
        description="RADIUS terpusat untuk banyak Mikrotik — satu aplikasi, banyak router."
        actions={
          <>
            {canManage ? (
              <Button size="sm" className="h-8" onClick={() => setConnectOpen(true)}>
                <PlusIcon className="size-4" />
                Hubungkan router
              </Button>
            ) : null}
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
          </>
        }
      />

      <RoutersKpis summary={summary} isLoading={isLoading} isError={isError} />

      <FilterTabs
        ariaLabel="Filter status router"
        value={status}
        onValueChange={setStatus}
        items={statusTabs}
      />

      <DataTable
        columns={routerColumns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage={
          table.search ? `Tidak ada router cocok dengan "${table.search}".` : 'Belum ada router.'
        }
        searchPlaceholder="Cari router…"
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

      {canManage ? <ConnectRouterDialog open={connectOpen} onOpenChange={setConnectOpen} /> : null}
    </div>
  )
}

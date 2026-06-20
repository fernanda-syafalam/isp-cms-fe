import { getRouteApi, Navigate } from '@tanstack/react-router'
import { DownloadIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { ResellerFilter } from '@/api/resellers'
import { FilterTabs, type FilterTabItem } from '@/components/shared/filter-tabs'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/table/data-table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useEffectiveRole } from '@/features/auth'
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'
import { statusLabel } from '@/lib/status-label'
import type { Reseller } from '@/schemas/reseller'

import { useExportResellers, useResellersList } from '../hooks/useResellers'
import { resellerColumns, toCsvRow } from './resellersColumns'
import { ResellerDetailSheet } from './ResellerDetailSheet'
import { ResellersKpis } from './ResellersKpis'

const routeApi = getRouteApi('/_auth/resellers/')

export function ResellersListPage() {
  const role = useEffectiveRole()
  const { status: statusParam } = routeApi.useSearch()
  const status = statusParam ?? 'all'
  const navigate = routeApi.useNavigate()
  const table = useTableQuery({ pageSize: 20 })
  const exportResellers = useExportResellers()
  const [isExporting, setIsExporting] = useState(false)
  const [openReseller, setOpenReseller] = useState<Reseller | null>(null)

  // Status is a URL filter; changing it rewinds to page 1.
  const setStatus = (value: string) => {
    navigate({ search: value === 'all' ? {} : { status: value } })
    table.resetPage()
  }

  const baseFilter: ResellerFilter = {
    ...(status === 'all' ? {} : { status }),
    q: table.params.q,
    sort: table.params.sort,
    order: table.params.order,
  }
  const { data, isLoading, isError, refetch } = useResellersList({
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
    { value: 'inactive', label: statusLabel('inactive'), count: by?.inactive },
  ]

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportResellers(baseFilter)
      downloadCsv('reseller', result.items.map(toCsvRow))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsExporting(false)
    }
  }

  // A partner (mitra) only sees their own storefront, not the org-wide table.
  // Demo identity = the first reseller record.
  if (role === 'mitra') {
    const mine = data?.items[0]
    if (mine) {
      return <Navigate to="/resellers/$resellerId" params={{ resellerId: mine.id }} replace />
    }
    return <Skeleton className="h-64 w-full" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reseller"
        description="Mitra loket/agen dan saldo komisinya."
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

      <ResellersKpis summary={summary} isLoading={isLoading} isError={isError} />

      <FilterTabs
        ariaLabel="Filter status reseller"
        value={status}
        onValueChange={setStatus}
        items={statusTabs}
      />

      <DataTable
        columns={resellerColumns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        onRowClick={(r) => setOpenReseller(r)}
        emptyMessage="Belum ada reseller."
        searchPlaceholder="Cari reseller…"
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

      <ResellerDetailSheet
        reseller={openReseller}
        open={openReseller !== null}
        onOpenChange={(open) => {
          if (!open) setOpenReseller(null)
        }}
      />
    </div>
  )
}

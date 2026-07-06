import { getRouteApi } from '@tanstack/react-router'
import { DownloadIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { WorkOrderFilter } from '@/api/workorders'
import { FilterTabs, type FilterTabItem } from '@/components/shared/filter-tabs'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/table/data-table'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCurrentUser, useEffectiveRole } from '@/features/auth'
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'
import { statusLabel } from '@/lib/status-label'
import type { WorkOrder } from '@/schemas/workorder'

import { useExportWorkOrders, useWorkOrdersList } from '../hooks/useWorkOrders'
import { WorkOrderDetailSheet } from './WorkOrderDetailSheet'
import { workOrderColumns, toCsvRow } from './workOrdersColumns'
import { WorkOrdersKpis } from './WorkOrdersKpis'

const TYPE_OPTIONS = ['all', 'install', 'repair', 'dismantle'] as const

const routeApi = getRouteApi('/_auth/work-orders')

export function WorkOrdersListPage() {
  const { status: statusParam, type: typeParam } = routeApi.useSearch()
  const status = statusParam ?? 'all'
  const type = typeParam ?? 'all'
  const navigate = routeApi.useNavigate()
  const table = useTableQuery({ pageSize: 20 })
  const exportWorkOrders = useExportWorkOrders()
  const role = useEffectiveRole()
  const { data: user } = useCurrentUser()
  const [isExporting, setIsExporting] = useState(false)
  const [openWo, setOpenWo] = useState<WorkOrder | null>(null)
  // "Tugas saya" (P3.B.1): a teknisi can scope the board to work orders assigned
  // to them. The BE matches the `technician` param exactly against the WO's
  // technician name, so we pass the current user's fullName. Off by default so
  // admin/staff keep the org-wide board.
  const [onlyMine, setOnlyMine] = useState(false)
  const technicianName = user?.fullName
  const canFilterMine = role === 'teknisi' && Boolean(technicianName)
  const mineActive = canFilterMine && onlyMine

  // Build a search object with only the keys that are set (omit when "all") so
  // it satisfies validateSearch under exactOptionalPropertyTypes. Changing a
  // URL filter resets the page so the user is never on an out-of-range page.
  const buildSearch = (s?: string, t?: string) => ({
    ...(s ? { status: s } : {}),
    ...(t ? { type: t } : {}),
  })
  const setStatus = (value: string) => {
    table.resetPage()
    navigate({
      search: buildSearch(value === 'all' ? undefined : value, typeParam),
    })
  }
  const setType = (value: string) => {
    table.resetPage()
    navigate({
      search: buildSearch(statusParam, value === 'all' ? undefined : value),
    })
  }

  // Equality filters come from the URL; search/sort/paging from the table.
  const baseFilter: WorkOrderFilter = {
    ...(status === 'all' ? {} : { status }),
    ...(type === 'all' ? {} : { type }),
    ...(mineActive && technicianName ? { technician: technicianName } : {}),
    q: table.params.q,
    sort: table.params.sort,
    order: table.params.order,
  }
  const { data, isLoading, isError, refetch } = useWorkOrdersList({
    ...baseFilter,
    limit: table.params.limit,
    offset: table.params.offset,
  })
  const items = data?.items ?? []
  const total = data?.total ?? 0
  const summary = data?.summary
  const by = summary?.byStatus

  const statusTabs: FilterTabItem[] = [
    { value: 'all', label: 'Semua', count: summary?.total },
    {
      value: 'scheduled',
      label: statusLabel('scheduled'),
      count: by?.scheduled,
    },
    {
      value: 'in_progress',
      label: statusLabel('in_progress'),
      count: by?.in_progress,
    },
    { value: 'done', label: statusLabel('done'), count: by?.done },
    {
      value: 'cancelled',
      label: statusLabel('cancelled'),
      count: by?.cancelled,
    },
  ]

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportWorkOrders(baseFilter)
      downloadCsv('work-order', result.items.map(toCsvRow))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Work Order"
        description="Instalasi, gangguan, dan pencabutan oleh tim teknisi."
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

      <WorkOrdersKpis summary={summary} isLoading={isLoading} isError={isError} />

      <FilterTabs
        ariaLabel="Filter status work order"
        value={status}
        onValueChange={setStatus}
        items={statusTabs}
      />

      <DataTable
        columns={workOrderColumns}
        data={items}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        onRowClick={(wo) => setOpenWo(wo)}
        emptyMessage="Belum ada work order."
        searchPlaceholder="Cari work order…"
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
        toolbar={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {canFilterMine ? (
              <Button
                type="button"
                variant={mineActive ? 'default' : 'outline'}
                size="sm"
                className="h-11 w-full sm:h-8 sm:w-auto"
                aria-pressed={mineActive}
                onClick={() => {
                  table.resetPage()
                  setOnlyMine((v) => !v)
                }}
              >
                Tugas saya
              </Button>
            ) : null}
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-11 w-full sm:h-8 sm:w-40" aria-label="Filter jenis">
                <SelectValue placeholder="Jenis" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t === 'all' ? 'Semua jenis' : statusLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <WorkOrderDetailSheet
        workOrder={openWo}
        open={openWo !== null}
        onOpenChange={(open) => {
          if (!open) setOpenWo(null)
        }}
      />
    </div>
  )
}

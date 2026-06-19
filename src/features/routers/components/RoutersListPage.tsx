import { Link, getRouteApi } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { DownloadIcon, PlusIcon, RouterIcon, WifiIcon, WifiOffIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { RouterFilter } from '@/api/routers'
import { FilterTabs, type FilterTabItem } from '@/components/shared/filter-tabs'
import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { useCan } from '@/features/auth'
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime, formatNumber } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Router, RouterStatus } from '@/schemas/router'

import { useExportRouters, useRoutersList } from '../hooks/useRouters'
import { ConnectRouterDialog } from './ConnectRouterDialog'

const STATUS_TONE: Record<RouterStatus, StatusTone> = {
  online: 'success',
  offline: 'danger',
}

const toCsvRow = (r: Router) => ({
  Router: r.name,
  Alamat: r.address,
  Model: r.model,
  'Secret PPPoE': r.secretCount,
  'Sinkron terakhir': formatDateTime(r.lastSyncAt),
  Status: statusLabel(r.status),
})

// Static column defs (no component state). Sortable keys (name/secretCount/
// lastSyncAt/status) match the backend sort whitelist; secretCount is a real
// cached column server-side so it is sortable. Alamat/Model are plain headers.
const COLUMNS: ColumnDef<Router>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Router" />,
    meta: { title: 'Router' },
    cell: ({ row }) => (
      <Link
        to="/network/routers/$routerId"
        params={{ routerId: row.original.id }}
        className="font-medium hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: 'address',
    header: 'Alamat',
    meta: { title: 'Alamat' },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.address}</span>,
  },
  { accessorKey: 'model', header: 'Model', meta: { title: 'Model' } },
  {
    accessorKey: 'secretCount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Secret PPPoE" />,
    meta: { title: 'Secret PPPoE', align: 'right' },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{formatNumber(row.original.secretCount)}</span>
    ),
  },
  {
    accessorKey: 'lastSyncAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Sinkron terakhir" />,
    meta: { title: 'Sinkron terakhir' },
    cell: ({ row }) => formatDateTime(row.original.lastSyncAt),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    meta: { title: 'Status' },
    cell: ({ row }) => (
      <StatusBadge
        tone={STATUS_TONE[row.original.status]}
        label={statusLabel(row.original.status)}
      />
    ),
  },
]

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

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total router"
          value={summary?.total ?? 0}
          hint="Mikrotik terhubung"
          icon={RouterIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Online"
          value={by?.online ?? 0}
          hint="aktif"
          icon={WifiIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Offline"
          value={by?.offline ?? 0}
          hint="tidak tersinkron"
          hintTone="negative"
          icon={WifiOffIcon}
          isLoading={isLoading}
          isError={isError}
        />
      </div>

      <FilterTabs
        ariaLabel="Filter status router"
        value={status}
        onValueChange={setStatus}
        items={statusTabs}
      />

      <DataTable
        columns={COLUMNS}
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

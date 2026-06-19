import { Link, Navigate, getRouteApi } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { CheckCircle2Icon, DownloadIcon, PowerOffIcon, StoreIcon, WalletIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { ResellerFilter } from '@/api/resellers'
import { FilterTabs, type FilterTabItem } from '@/components/shared/filter-tabs'
import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useEffectiveRole } from '@/features/auth'
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Reseller, ResellerStatus } from '@/schemas/reseller'

import { useExportResellers, useResellersList } from '../hooks/useResellers'
import { ResellerDetailSheet } from './ResellerDetailSheet'
import { ResellerRowActions } from './ResellerRowActions'

const STATUS_TONE: Record<ResellerStatus, StatusTone> = {
  active: 'success',
  inactive: 'neutral',
}

const toCsvRow = (r: Reseller) => ({
  Reseller: r.name,
  Area: r.area,
  Pelanggan: r.customerCount,
  Komisi: formatPercent(r.commissionPct),
  Saldo: formatCurrency(r.balance),
  Status: statusLabel(r.status),
})

// Static column defs (no component state): sortable keys (name/commissionPct/
// balance/status) match the backend sort whitelist. customerCount is derived
// server-side (counted by name), not a sortable column, so it stays unsorted.
const COLUMNS: ColumnDef<Reseller>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Reseller" />,
    meta: { title: 'Reseller' },
    cell: ({ row }) => (
      <Link
        to="/resellers/$resellerId"
        params={{ resellerId: row.original.id }}
        className="font-medium hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  { accessorKey: 'area', header: 'Area', meta: { title: 'Area' } },
  {
    accessorKey: 'customerCount',
    header: 'Pelanggan',
    meta: { title: 'Pelanggan', align: 'right' },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{formatNumber(row.original.customerCount)}</span>
    ),
  },
  {
    accessorKey: 'commissionPct',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Komisi" />,
    meta: { title: 'Komisi', align: 'right' },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{formatPercent(row.original.commissionPct)}</span>
    ),
  },
  {
    accessorKey: 'balance',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Saldo" />,
    meta: { title: 'Saldo', align: 'right' },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{formatCurrency(row.original.balance)}</span>
    ),
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
  {
    id: 'actions',
    meta: { align: 'right' },
    enableHiding: false,
    cell: ({ row }) => <ResellerRowActions reseller={row.original} />,
  },
]

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total reseller"
          value={summary?.total ?? 0}
          hint="mitra terdaftar"
          icon={StoreIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Aktif"
          value={by?.active ?? 0}
          hint="berjualan"
          icon={CheckCircle2Icon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Nonaktif"
          value={by?.inactive ?? 0}
          hint="dinonaktifkan"
          icon={PowerOffIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Total saldo"
          value={summary?.totalBalance ?? 0}
          format={formatCurrency}
          hint="deposit komisi"
          icon={WalletIcon}
          isLoading={isLoading}
          isError={isError}
        />
      </div>

      <FilterTabs
        ariaLabel="Filter status reseller"
        value={status}
        onValueChange={setStatus}
        items={statusTabs}
      />

      <DataTable
        columns={COLUMNS}
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

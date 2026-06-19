import { Link, getRouteApi } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { ActivityIcon, DownloadIcon, GaugeIcon, TriangleAlertIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { UsageFilter } from '@/api/usage'
import { FilterTabs, type FilterTabItem } from '@/components/shared/filter-tabs'
import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'
import { formatNumber } from '@/lib/format'
import type { UsageRecord } from '@/schemas/usage'

import { useExportUsage, useUsageList } from '../hooks/useUsage'
import { UsageDetailSheet } from './UsageDetailSheet'

const pct = (used: number, quota: number) =>
  quota <= 0 ? 0 : Math.min(100, Math.round((used / quota) * 100))

const toCsvRow = (u: UsageRecord) => ({
  Pelanggan: u.customerName,
  Paket: u.planName,
  'Kuota (GB)': u.quotaGb === 0 ? 'Unlimited' : u.quotaGb,
  'Terpakai (GB)': u.usedGb,
  Status: u.fupThrottled ? 'FUP' : 'Normal',
})

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

  const columns = useMemo<ColumnDef<UsageRecord>[]>(
    () => [
      {
        accessorKey: 'customerName',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Pelanggan" />,
        meta: { title: 'Pelanggan' },
        cell: ({ row }) => (
          <Link
            to="/customers/$customerId"
            params={{ customerId: row.original.customerId }}
            className="font-medium hover:underline"
          >
            {row.original.customerName}
          </Link>
        ),
      },
      { accessorKey: 'planName', header: 'Paket', meta: { title: 'Paket' } },
      {
        accessorKey: 'quotaGb',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Kuota" />,
        meta: { title: 'Kuota', align: 'right' },
        cell: ({ row }) =>
          row.original.quotaGb === 0 ? (
            <span className="text-muted-foreground">Unlimited</span>
          ) : (
            <span className="font-mono tabular-nums">{formatNumber(row.original.quotaGb)} GB</span>
          ),
      },
      {
        accessorKey: 'usedGb',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Pemakaian" />,
        meta: { title: 'Pemakaian' },
        cell: ({ row }) => {
          const { usedGb, quotaGb } = row.original
          const p = pct(usedGb, quotaGb)
          return (
            <div className="w-40">
              <div className="flex justify-between text-xs">
                <span className="font-mono tabular-nums">{formatNumber(usedGb)} GB</span>
                {quotaGb > 0 ? <span className="text-muted-foreground">{p}%</span> : null}
              </div>
              {quotaGb > 0 ? (
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${p >= 100 ? 'bg-red-500' : p >= 80 ? 'bg-amber-500' : 'bg-primary'}`}
                    style={{ width: `${Math.max(2, p)}%` }}
                  />
                </div>
              ) : null}
            </div>
          )
        },
      },
      {
        accessorKey: 'fupThrottled',
        header: 'Status',
        meta: { title: 'Status' },
        cell: ({ row }) =>
          row.original.fupThrottled ? (
            <StatusBadge tone="warning" label="FUP (dibatasi)" />
          ) : (
            <StatusBadge tone="success" label="Normal" />
          ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pemakaian & FUP"
        description="Konsumsi data per pelanggan periode berjalan (dari akunting RADIUS)."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total pemakaian"
          value={summary?.totalUsedGb ?? 0}
          format={(v) => `${formatNumber(v)} GB`}
          hint="periode berjalan"
          icon={ActivityIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Kena FUP"
          value={summary?.throttled ?? 0}
          hint="pelanggan dibatasi"
          hintTone="negative"
          icon={TriangleAlertIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Rata-rata / pelanggan"
          value={summary?.avgUsedGb ?? 0}
          format={(v) => `${formatNumber(v)} GB`}
          icon={GaugeIcon}
          isLoading={isLoading}
          isError={isError}
        />
      </div>

      <FilterTabs
        ariaLabel="Filter status FUP"
        value={status}
        onValueChange={setStatus}
        items={statusTabs}
      />

      <DataTable
        columns={columns}
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

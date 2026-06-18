import type { ColumnDef } from '@tanstack/react-table'
import { DownloadIcon, NetworkIcon, PlugZapIcon, SignalIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { OdpFilter, OdpView } from '@/api/odp'
import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'
import type { OdpRecord, OdpStatus } from '@/schemas/odp'

import { useExportOdp, useOdpList } from '../hooks/useOdp'

const STATUS_TONE: Record<OdpStatus, StatusTone> = {
  healthy: 'success',
  warning: 'warning',
  critical: 'danger',
}

const STATUS_LABEL: Record<OdpStatus, string> = {
  healthy: 'Sehat',
  warning: 'Perhatian',
  critical: 'Kritis',
}

// 'all' has no server view param; the rest map straight to the `view` query.
const FILTERS = ['all', 'available', 'full', 'optical'] as const
type Filter = (typeof FILTERS)[number]
const FILTER_LABEL: Record<Filter, string> = {
  all: 'Semua ODP',
  available: 'Ada slot kosong',
  full: 'Penuh',
  optical: 'Optik bermasalah',
}

const free = (o: OdpRecord) => o.totalPorts - o.usedPorts

const toCsvRow = (o: OdpRecord) => ({
  ODP: o.name,
  Area: o.area,
  Splitter: o.splitter,
  Port: `${o.usedPorts}/${o.totalPorts}`,
  'Slot kosong': free(o),
  'Redaman (dBm)': o.avgRxPowerDbm,
  Status: STATUS_LABEL[o.status],
})

// Static column defs (no component state). Sortable keys (name/usedPorts/
// avgRxPowerDbm) match the backend sort whitelist; the rest are plain.
const COLUMNS: ColumnDef<OdpRecord>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="ODP" />,
    meta: { title: 'ODP' },
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  { accessorKey: 'area', header: 'Area', meta: { title: 'Area' } },
  {
    accessorKey: 'splitter',
    header: 'Splitter',
    meta: { title: 'Splitter' },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.splitter}</span>,
  },
  {
    accessorKey: 'usedPorts',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kapasitas port" />,
    meta: { title: 'Kapasitas port' },
    cell: ({ row }) => {
      const { usedPorts, totalPorts } = row.original
      const p = Math.round((usedPorts / totalPorts) * 100)
      return (
        <div className="w-36">
          <div className="flex justify-between text-xs">
            <span className="font-mono tabular-nums">
              {usedPorts}/{totalPorts}
            </span>
            <span className="text-muted-foreground">{p}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${p >= 100 ? 'bg-red-500' : p >= 80 ? 'bg-amber-500' : 'bg-primary'}`}
              style={{ width: `${Math.max(2, p)}%` }}
            />
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'avgRxPowerDbm',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Redaman" />,
    meta: { title: 'Redaman', align: 'right' },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{row.original.avgRxPowerDbm} dBm</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Optik',
    meta: { title: 'Optik' },
    cell: ({ row }) => (
      <StatusBadge
        tone={STATUS_TONE[row.original.status]}
        label={STATUS_LABEL[row.original.status]}
      />
    ),
  },
]

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
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total ODP"
          value={summary?.totalOdp ?? 0}
          icon={NetworkIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Utilisasi port"
          value={summary?.utilization ?? 0}
          format={(v) => `${v}%`}
          hint="terpakai"
          accent="amber"
          icon={PlugZapIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="ODP penuh"
          value={summary?.full ?? 0}
          hint="tanpa slot kosong"
          hintTone="negative"
          icon={PlugZapIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Optik bermasalah"
          value={summary?.optical ?? 0}
          hint="redaman tinggi"
          hintTone="negative"
          icon={SignalIcon}
          isLoading={isLoading}
          isError={isError}
        />
      </div>

      <DataTable
        columns={COLUMNS}
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
        toolbar={
          <Select value={filter} onValueChange={setView}>
            <SelectTrigger className="h-8 w-48" aria-label="Filter ODP">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              {FILTERS.map((f) => (
                <SelectItem key={f} value={f}>
                  {FILTER_LABEL[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
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
    </div>
  )
}

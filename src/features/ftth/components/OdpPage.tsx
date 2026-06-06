import type { ColumnDef } from '@tanstack/react-table'
import { DownloadIcon, NetworkIcon, PlugZapIcon, SignalIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

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
import { downloadCsv } from '@/lib/csv'
import type { OdpRecord, OdpStatus } from '@/schemas/odp'

import { useOdpList } from '../hooks/useOdp'

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

export function OdpPage() {
  const { data, isLoading, isError } = useOdpList()
  const [filter, setFilter] = useState<Filter>('all')

  const items = useMemo(() => {
    const all = data?.items ?? []
    switch (filter) {
      case 'available':
        return all.filter((o) => free(o) > 0)
      case 'full':
        return all.filter((o) => free(o) === 0)
      case 'optical':
        return all.filter((o) => o.status !== 'healthy')
      default:
        return all
    }
  }, [data, filter])

  const summary = useMemo(() => {
    const all = data?.items ?? []
    const totalPorts = all.reduce((s, o) => s + o.totalPorts, 0)
    const usedPorts = all.reduce((s, o) => s + o.usedPorts, 0)
    return {
      total: all.length,
      utilization: totalPorts ? Math.round((usedPorts / totalPorts) * 100) : 0,
      full: all.filter((o) => free(o) === 0).length,
      optical: all.filter((o) => o.status !== 'healthy').length,
    }
  }, [data])

  const columns = useMemo<ColumnDef<OdpRecord>[]>(
    () => [
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
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="FTTH / ODP"
        description="Kapasitas port ODP & kesehatan optik (redaman) untuk perencanaan instalasi."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading || !data ? (
          <>
            <KpiSkeleton />
          </>
        ) : (
          <>
            <KpiCard label="Total ODP" value={summary.total} icon={NetworkIcon} />
            <KpiCard
              label="Utilisasi port"
              value={summary.utilization}
              format={(v) => `${v}%`}
              hint="terpakai"
              accent="amber"
              icon={PlugZapIcon}
            />
            <KpiCard
              label="ODP penuh"
              value={summary.full}
              hint="tanpa slot kosong"
              hintTone="negative"
              icon={PlugZapIcon}
            />
            <KpiCard
              label="Optik bermasalah"
              value={summary.optical}
              hint="redaman tinggi"
              hintTone="negative"
              icon={SignalIcon}
            />
          </>
        )}
      </div>

      <DataTable
        columns={columns}
        data={isLoading ? undefined : items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Tidak ada ODP yang cocok."
        searchPlaceholder="Cari ODP / area…"
        toolbar={
          <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
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
            disabled={!items.length}
            onClick={() => downloadCsv('odp', items.map(toCsvRow))}
          >
            <DownloadIcon className="size-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        }
      />
    </div>
  )
}

function KpiSkeleton() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
      ))}
    </>
  )
}

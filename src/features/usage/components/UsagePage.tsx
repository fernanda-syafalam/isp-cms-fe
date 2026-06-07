import type { ColumnDef } from '@tanstack/react-table'
import { ActivityIcon, DownloadIcon, GaugeIcon, TriangleAlertIcon } from 'lucide-react'
import { useMemo } from 'react'

import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { downloadCsv } from '@/lib/csv'
import { formatNumber } from '@/lib/format'
import type { UsageRecord } from '@/schemas/usage'

import { useUsageList } from '../hooks/useUsage'

const pct = (used: number, quota: number) =>
  quota <= 0 ? 0 : Math.min(100, Math.round((used / quota) * 100))

const toCsvRow = (u: UsageRecord) => ({
  Pelanggan: u.customerName,
  Paket: u.planName,
  'Kuota (GB)': u.quotaGb === 0 ? 'Unlimited' : u.quotaGb,
  'Terpakai (GB)': u.usedGb,
  Status: u.fupThrottled ? 'FUP' : 'Normal',
})

export function UsagePage() {
  const { data, isLoading, isError } = useUsageList()

  const summary = useMemo(() => {
    const items = data?.items ?? []
    const total = items.reduce((s, u) => s + u.usedGb, 0)
    const throttled = items.filter((u) => u.fupThrottled).length
    return {
      total,
      throttled,
      avg: items.length ? Math.round(total / items.length) : 0,
    }
  }, [data])

  const columns = useMemo<ColumnDef<UsageRecord>[]>(
    () => [
      {
        accessorKey: 'customerName',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Pelanggan" />,
        meta: { title: 'Pelanggan' },
        cell: ({ row }) => <span className="font-medium">{row.original.customerName}</span>,
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
        {isLoading || !data ? (
          <>
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </>
        ) : (
          <>
            <KpiCard
              label="Total pemakaian"
              value={summary.total}
              format={(v) => `${formatNumber(v)} GB`}
              hint="periode berjalan"
              icon={ActivityIcon}
            />
            <KpiCard
              label="Kena FUP"
              value={summary.throttled}
              hint="pelanggan dibatasi"
              hintTone="negative"
              icon={TriangleAlertIcon}
            />
            <KpiCard
              label="Rata-rata / pelanggan"
              value={summary.avg}
              format={(v) => `${formatNumber(v)} GB`}
              icon={GaugeIcon}
            />
          </>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada data pemakaian."
        searchPlaceholder="Cari pelanggan / paket…"
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={!data?.items.length}
            onClick={() => downloadCsv('pemakaian', (data?.items ?? []).map(toCsvRow))}
          >
            <DownloadIcon className="size-4" />
            <span className="hidden sm:inline">Ekspor</span>
          </Button>
        }
      />
    </div>
  )
}

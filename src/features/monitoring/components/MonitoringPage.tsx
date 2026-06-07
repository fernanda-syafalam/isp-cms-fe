import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { ActivitySquareIcon, BellIcon, ServerIcon, TicketPlusIcon } from 'lucide-react'
import { useMemo } from 'react'

import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCan } from '@/features/auth'
import { formatDateTime, formatNumber } from '@/lib/format'
import type { Alert, DeviceMetric, MetricStatus } from '@/schemas/monitoring'

import {
  useAcknowledgeAlert,
  useAlerts,
  useCreateTicketFromAlert,
  useDeviceMetrics,
} from '../hooks/useMonitoring'

const METRIC_TONE: Record<MetricStatus, StatusTone> = {
  up: 'success',
  degraded: 'warning',
  down: 'danger',
}

const METRIC_LABEL: Record<MetricStatus, string> = {
  up: 'Up',
  degraded: 'Menurun',
  down: 'Down',
}

export function MonitoringPage() {
  const metrics = useDeviceMetrics()
  const alerts = useAlerts()
  const canManage = useCan('network.manage')

  const summary = useMemo(() => {
    const items = metrics.data?.items ?? []
    const up = items.filter((m) => m.status === 'up').length
    const avgUptime = items.length
      ? Math.round((items.reduce((s, m) => s + m.uptimePct, 0) / items.length) * 10) / 10
      : 0
    const activeAlerts = (alerts.data?.items ?? []).filter((a) => !a.acknowledged).length
    const overall = items.some((m) => m.status === 'down')
      ? { tone: 'danger' as StatusTone, label: 'Gangguan' }
      : items.some((m) => m.status === 'degraded')
        ? { tone: 'warning' as StatusTone, label: 'Menurun' }
        : { tone: 'success' as StatusTone, label: 'Operasional' }
    return { up, total: items.length, avgUptime, activeAlerts, overall }
  }, [metrics.data, alerts.data])

  const columns = useMemo<ColumnDef<DeviceMetric>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Perangkat" />,
        meta: { title: 'Perangkat' },
        cell: ({ row }) => (
          <Link
            to="/network/devices/$deviceId"
            params={{ deviceId: row.original.deviceId }}
            className="font-medium hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Jenis',
        meta: { title: 'Jenis' },
        cell: ({ row }) => <span className="uppercase">{row.original.type}</span>,
      },
      { accessorKey: 'areaName', header: 'Area', meta: { title: 'Area' } },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        meta: { title: 'Status' },
        cell: ({ row }) => (
          <StatusBadge
            tone={METRIC_TONE[row.original.status]}
            label={METRIC_LABEL[row.original.status]}
          />
        ),
      },
      {
        accessorKey: 'uptimePct',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Uptime" />,
        meta: { title: 'Uptime', align: 'right' },
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">{row.original.uptimePct}%</span>
        ),
      },
      {
        accessorKey: 'latencyMs',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Latensi" />,
        meta: { title: 'Latensi', align: 'right' },
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">{formatNumber(row.original.latencyMs)} ms</span>
        ),
      },
      {
        accessorKey: 'utilizationPct',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Utilisasi" />,
        meta: { title: 'Utilisasi', align: 'right' },
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">{row.original.utilizationPct}%</span>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoring NOC"
        description="Kesehatan perangkat jaringan & alert."
        actions={<StatusBadge tone={summary.overall.tone} label={summary.overall.label} />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Perangkat online"
          value={summary.up}
          format={(v) => `${formatNumber(v)} / ${summary.total}`}
          hint="up saat ini"
          icon={ServerIcon}
        />
        <KpiCard
          label="Uptime rata-rata"
          value={summary.avgUptime}
          format={(v) => `${v}%`}
          hint="30 hari"
          icon={ActivitySquareIcon}
        />
        <KpiCard
          label="Alert aktif"
          value={summary.activeAlerts}
          hint="belum ditangani"
          hintTone={summary.activeAlerts > 0 ? 'negative' : 'positive'}
          icon={BellIcon}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alert aktif</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertsList alerts={alerts.data?.items} canManage={canManage} />
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={metrics.data?.items}
        isLoading={metrics.isLoading}
        isError={metrics.isError}
        emptyMessage="Belum ada data perangkat."
        searchPlaceholder="Cari perangkat / area…"
      />
    </div>
  )
}

function AlertsList({ alerts, canManage }: { alerts: Alert[] | undefined; canManage: boolean }) {
  const ack = useAcknowledgeAlert()
  const ticket = useCreateTicketFromAlert()

  if (!alerts) return <p className="py-4 text-muted-foreground text-sm">Memuat…</p>
  const active = alerts.filter((a) => !a.acknowledged)
  if (active.length === 0) {
    return (
      <p className="py-4 text-center text-muted-foreground text-sm">
        Tidak ada alert aktif. Jaringan sehat. ✅
      </p>
    )
  }

  return (
    <ul className="divide-y divide-border">
      {active.map((a) => (
        <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <StatusBadge
              tone={a.severity === 'critical' ? 'danger' : 'warning'}
              label={a.severity === 'critical' ? 'Kritis' : 'Peringatan'}
            />
            <div className="min-w-0">
              <p className="truncate text-sm">{a.message}</p>
              <p className="text-muted-foreground text-xs">
                <Link
                  to="/network/devices/$deviceId"
                  params={{ deviceId: a.deviceId }}
                  className="hover:underline"
                >
                  {a.deviceName}
                </Link>{' '}
                · {formatDateTime(a.at)}
              </p>
            </div>
          </div>
          {canManage ? (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={ticket.isPending}
                onClick={() => ticket.mutate(a.id)}
              >
                <TicketPlusIcon className="size-4" />
                Buat tiket
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={ack.isPending}
                onClick={() => ack.mutate(a.id)}
              >
                Tandai ditangani
              </Button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

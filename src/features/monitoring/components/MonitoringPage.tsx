import { getRouteApi } from '@tanstack/react-router'
import { ActivitySquareIcon, BellIcon, ServerIcon } from 'lucide-react'

import { FilterTabs, type FilterTabItem } from '@/components/shared/filter-tabs'
import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCan } from '@/features/auth'
import { useTableQuery } from '@/hooks/useTableQuery'
import { formatNumber } from '@/lib/format'

import { useAlerts, useDeviceMetrics } from '../hooks/useMonitoring'
import { MonitoringAlertsList } from './MonitoringAlertsList'
import { METRIC_LABEL, monitoringColumns } from './monitoringColumns'

const routeApi = getRouteApi('/_auth/network/monitoring')

export function MonitoringPage() {
  const { status: statusParam } = routeApi.useSearch()
  const status = statusParam ?? 'all'
  const navigate = routeApi.useNavigate()
  const table = useTableQuery({ pageSize: 20 })
  const metrics = useDeviceMetrics({
    ...(status === 'all' ? {} : { status }),
    q: table.params.q,
    sort: table.params.sort,
    order: table.params.order,
    limit: table.params.limit,
    offset: table.params.offset,
  })
  const alerts = useAlerts()
  const canManage = useCan('network.manage')

  // Status is a URL filter on the device table; changing it rewinds to page 1.
  const setStatus = (value: string) => {
    navigate({ search: value === 'all' ? {} : { status: value } })
    table.resetPage()
  }

  // Fleet-health aggregate is a full-set server value (ignores q/sort/paging),
  // so the KPI cards + overall badge stay correct under any table filter.
  const summary = metrics.data?.summary
  const total = metrics.data?.total ?? 0
  const alertItems = alerts.data?.items
  const activeAlerts = (alertItems ?? []).filter((a) => !a.acknowledged).length
  // KPI cards span two queries (device metrics + alerts); show loading/error
  // until both settle so they never flash a fake 0 or skeleton forever.
  const kpiLoading = metrics.isLoading || alerts.isLoading
  const kpiError = metrics.isError || alerts.isError
  const overall = !summary
    ? { tone: 'neutral' as StatusTone, label: 'Memuat…' }
    : summary.down > 0
      ? { tone: 'danger' as StatusTone, label: 'Gangguan' }
      : summary.degraded > 0
        ? { tone: 'warning' as StatusTone, label: 'Menurun' }
        : { tone: 'success' as StatusTone, label: 'Operasional' }

  const statusTabs: FilterTabItem[] = [
    { value: 'all', label: 'Semua', count: summary?.total },
    { value: 'up', label: METRIC_LABEL.up, count: summary?.up },
    {
      value: 'degraded',
      label: METRIC_LABEL.degraded,
      count: summary?.degraded,
    },
    { value: 'down', label: METRIC_LABEL.down, count: summary?.down },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoring NOC"
        description="Kesehatan perangkat jaringan & alert."
        actions={<StatusBadge tone={overall.tone} label={overall.label} />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Perangkat online"
          value={summary?.up ?? 0}
          format={(v) => `${formatNumber(v)} / ${formatNumber(summary?.total ?? 0)}`}
          hint="up saat ini"
          icon={ServerIcon}
          isLoading={kpiLoading}
          isError={kpiError}
        />
        <KpiCard
          label="Uptime rata-rata"
          value={summary?.avgUptimePct ?? 0}
          format={(v) => `${v}%`}
          hint="30 hari"
          icon={ActivitySquareIcon}
          isLoading={kpiLoading}
          isError={kpiError}
        />
        <KpiCard
          label="Alert aktif"
          value={activeAlerts}
          hint="belum ditangani"
          hintTone={activeAlerts > 0 ? 'negative' : 'positive'}
          icon={BellIcon}
          isLoading={kpiLoading}
          isError={kpiError}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alert aktif</CardTitle>
        </CardHeader>
        <CardContent>
          <MonitoringAlertsList alerts={alerts.data?.items} canManage={canManage} />
        </CardContent>
      </Card>

      <FilterTabs
        ariaLabel="Filter status perangkat"
        value={status}
        onValueChange={setStatus}
        items={statusTabs}
      />

      <DataTable
        columns={monitoringColumns}
        data={metrics.data?.items}
        isLoading={metrics.isLoading}
        isError={metrics.isError}
        emptyMessage={
          table.search
            ? `Tidak ada perangkat cocok dengan "${table.search}".`
            : 'Belum ada data perangkat.'
        }
        searchPlaceholder="Cari perangkat / area…"
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
    </div>
  )
}

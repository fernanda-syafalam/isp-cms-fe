import { Link, getRouteApi } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import {
  CheckCircle2Icon,
  DownloadIcon,
  ServerIcon,
  TriangleAlertIcon,
  WifiOffIcon,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { DeviceFilter } from '@/api/devices'
import { FilterTabs, type FilterTabItem } from '@/components/shared/filter-tabs'
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
import { formatDateTime, formatNumber } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Device, DeviceStatus } from '@/schemas/device'

import { useDevicesList, useExportDevices } from '../hooks/useDevices'
import { DeviceRowActions } from './DeviceRowActions'

const STATUS_TONE: Record<DeviceStatus, StatusTone> = {
  online: 'success',
  degraded: 'warning',
  offline: 'danger',
}

const TYPE_OPTIONS = ['all', 'olt', 'onu', 'mikrotik'] as const

const routeApi = getRouteApi('/_auth/network/devices/')

// GPON optical health: healthy ≳ −25 dBm, marginal −25…−27, bad < −27.
function rxTone(dbm: number): StatusTone {
  if (dbm >= -25) return 'success'
  if (dbm >= -27) return 'warning'
  return 'danger'
}

const toCsvRow = (d: Device) => ({
  Perangkat: d.name,
  Tipe: d.type.toUpperCase(),
  'Alamat IP': d.ipAddress,
  Area: d.areaName,
  Redaman: d.rxPower == null ? '—' : `${d.rxPower} dBm`,
  Uptime: `${Math.round(d.uptimeHours)} j`,
  'Terakhir terlihat': formatDateTime(d.lastSeenAt),
  Status: statusLabel(d.status),
})

// Static column defs (no component state): sortable keys (name/rxPower/
// uptimeHours/lastSeenAt/status) match the backend sort whitelist.
const COLUMNS: ColumnDef<Device>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Perangkat" />,
    meta: { title: 'Perangkat' },
    cell: ({ row }) => (
      <Link
        to="/network/devices/$deviceId"
        params={{ deviceId: row.original.id }}
        className="font-medium hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Tipe',
    meta: { title: 'Tipe' },
    cell: ({ row }) => <span className="uppercase">{row.original.type}</span>,
  },
  {
    accessorKey: 'ipAddress',
    header: 'Alamat IP',
    meta: { title: 'Alamat IP' },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.ipAddress}</span>,
  },
  { accessorKey: 'areaName', header: 'Area', meta: { title: 'Area' } },
  {
    accessorKey: 'rxPower',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Redaman" />,
    meta: { title: 'Redaman', align: 'right' },
    cell: ({ row }) =>
      row.original.rxPower == null ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        <StatusBadge
          tone={rxTone(row.original.rxPower)}
          label={`${row.original.rxPower} dBm`}
          dot={false}
        />
      ),
  },
  {
    accessorKey: 'uptimeHours',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Uptime" />,
    meta: { title: 'Uptime', align: 'right' },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">
        {formatNumber(Math.round(row.original.uptimeHours))} j
      </span>
    ),
  },
  {
    accessorKey: 'lastSeenAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Terakhir terlihat" />,
    meta: { title: 'Terakhir terlihat' },
    cell: ({ row }) => formatDateTime(row.original.lastSeenAt),
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
    cell: ({ row }) => <DeviceRowActions device={row.original} />,
  },
]

export function DevicesListPage() {
  const { status: statusParam } = routeApi.useSearch()
  const status = statusParam ?? 'all'
  const navigate = routeApi.useNavigate()
  const [type, setTypeState] = useState('all')
  const table = useTableQuery({ pageSize: 20 })
  const exportDevices = useExportDevices()
  const [isExporting, setIsExporting] = useState(false)

  // Changing a filter resets the page so the user is never on an out-of-range
  // page. Status lives in the URL (deep-link); type is a local control.
  const setStatus = (value: string) => {
    table.resetPage()
    navigate({ search: value === 'all' ? {} : { status: value } })
  }
  const setType = (value: string) => {
    table.resetPage()
    setTypeState(value)
  }

  // Equality filters drive the server query; search/sort/paging from the table.
  const baseFilter: DeviceFilter = {
    ...(status === 'all' ? {} : { status }),
    ...(type === 'all' ? {} : { type }),
    q: table.params.q,
    sort: table.params.sort,
    order: table.params.order,
  }
  const { data, isLoading, isError } = useDevicesList({
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
    { value: 'online', label: statusLabel('online'), count: by?.online },
    { value: 'degraded', label: statusLabel('degraded'), count: by?.degraded },
    { value: 'offline', label: statusLabel('offline'), count: by?.offline },
  ]

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportDevices(baseFilter)
      downloadCsv('perangkat', result.items.map(toCsvRow))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Perangkat Jaringan"
        description="Perangkat OLT, ONU, dan Mikrotik."
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
          label="Total perangkat"
          value={summary?.total ?? 0}
          hint="OLT / ONU / Mikrotik"
          icon={ServerIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Online"
          value={by?.online ?? 0}
          hint="sehat"
          icon={CheckCircle2Icon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Menurun"
          value={by?.degraded ?? 0}
          hint="perlu perhatian"
          accent="amber"
          icon={TriangleAlertIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Offline"
          value={by?.offline ?? 0}
          hint="tidak terjangkau"
          hintTone="negative"
          icon={WifiOffIcon}
          isLoading={isLoading}
          isError={isError}
        />
      </div>

      <FilterTabs
        ariaLabel="Filter status perangkat"
        value={status}
        onValueChange={setStatus}
        items={statusTabs}
      />

      <DataTable
        columns={COLUMNS}
        data={items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada perangkat."
        searchPlaceholder="Cari perangkat / IP…"
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
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-11 w-full sm:h-8 sm:w-40" aria-label="Filter tipe">
              <SelectValue placeholder="Tipe" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t === 'all' ? 'Semua tipe' : t.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
    </div>
  )
}

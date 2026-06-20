import { getRouteApi } from '@tanstack/react-router'
import { DownloadIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { DeviceFilter } from '@/api/devices'
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
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'
import { statusLabel } from '@/lib/status-label'

import { useDevicesList, useExportDevices } from '../hooks/useDevices'
import { DeviceDetailSheet } from './DeviceDetailSheet'
import { deviceColumns, toCsvRow } from './devicesColumns'
import { DevicesKpis } from './DevicesKpis'

const TYPE_OPTIONS = ['all', 'olt', 'onu', 'mikrotik'] as const

const routeApi = getRouteApi('/_auth/network/devices/')

export function DevicesListPage() {
  const { status: statusParam } = routeApi.useSearch()
  const status = statusParam ?? 'all'
  const navigate = routeApi.useNavigate()
  const [type, setTypeState] = useState('all')
  const table = useTableQuery({ pageSize: 20 })
  const exportDevices = useExportDevices()
  const [isExporting, setIsExporting] = useState(false)
  const [openDeviceId, setOpenDeviceId] = useState<string | null>(null)

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

      <DevicesKpis summary={summary} isLoading={isLoading} isError={isError} />

      <FilterTabs
        ariaLabel="Filter status perangkat"
        value={status}
        onValueChange={setStatus}
        items={statusTabs}
      />

      <DataTable
        columns={deviceColumns}
        data={items}
        isLoading={isLoading}
        isError={isError}
        onRowClick={(d) => setOpenDeviceId(d.id)}
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

      <DeviceDetailSheet
        deviceId={openDeviceId}
        open={openDeviceId !== null}
        onOpenChange={(open) => {
          if (!open) setOpenDeviceId(null)
        }}
      />
    </div>
  )
}

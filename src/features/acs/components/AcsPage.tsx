import { getRouteApi } from '@tanstack/react-router'
import { RotateCwIcon, UploadCloudIcon, WifiIcon } from 'lucide-react'
import { useState } from 'react'

import { FilterTabs, type FilterTabItem } from '@/components/shared/filter-tabs'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/table/data-table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useCan } from '@/features/auth'
import { useTableQuery } from '@/hooks/useTableQuery'

import { useAcsDevices, useBulkAcs } from '../hooks/useAcs'
import { acsColumns } from './acsColumns'
import { AcsKpis } from './AcsKpis'
import { BulkFirmwareDialog } from './BulkFirmwareDialog'
import { BulkWifiDialog } from './BulkWifiDialog'

const routeApi = getRouteApi('/_auth/network/acs')

export function AcsPage() {
  const { q, status: statusParam } = routeApi.useSearch()
  const status = statusParam ?? 'all'
  const navigate = routeApi.useNavigate()
  const canManage = useCan('network.manage')
  const bulk = useBulkAcs()
  const [fwIds, setFwIds] = useState<string[] | null>(null)
  const [wifiIds, setWifiIds] = useState<string[] | null>(null)

  // ?q= deep-link (e.g. from a customer's connection tab) seeds the search box.
  const table = useTableQuery({ pageSize: 20, initialSearch: q })

  // Status is a URL filter; changing it rewinds to page 1 (preserves ?q=).
  const setStatus = (value: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        status: value === 'all' ? undefined : value,
      }),
    })
    table.resetPage()
  }

  const { data, isLoading, isError } = useAcsDevices({
    ...(status === 'all' ? {} : { status }),
    q: table.params.q,
    sort: table.params.sort,
    order: table.params.order,
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="ONU / TR-069 (GenieACS)"
        description="Kelola CPE pelanggan massal: reboot, firmware, WiFi."
      />

      <AcsKpis summary={summary} isLoading={isLoading} isError={isError} />

      <FilterTabs
        ariaLabel="Filter status CPE"
        value={status}
        onValueChange={setStatus}
        items={statusTabs}
      />

      <DataTable
        columns={acsColumns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage={
          table.search
            ? `Tidak ada ONU cocok dengan "${table.search}".`
            : 'Belum ada perangkat CPE.'
        }
        searchPlaceholder="Cari serial / pelanggan…"
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
        enableSelection={canManage}
        bulkActions={(selected) => {
          const ids = selected.map((d) => d.id)
          return (
            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8" disabled={bulk.isPending}>
                    <RotateCwIcon className="size-4" />
                    Reboot
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reboot {ids.length} perangkat?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {ids.length} perangkat CPE terpilih akan di-reboot. Koneksi internet pelanggan
                      terputus sekitar 2 menit selama perangkat menyala ulang.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => bulk.mutate({ action: 'reboot', deviceIds: ids })}
                    >
                      Reboot ({ids.length})
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button variant="outline" size="sm" className="h-8" onClick={() => setFwIds(ids)}>
                <UploadCloudIcon className="size-4" />
                Firmware
              </Button>
              <Button variant="outline" size="sm" className="h-8" onClick={() => setWifiIds(ids)}>
                <WifiIcon className="size-4" />
                WiFi
              </Button>
            </div>
          )
        }}
      />

      {fwIds ? (
        <BulkFirmwareDialog
          deviceIds={fwIds}
          open={fwIds !== null}
          onOpenChange={(o) => !o && setFwIds(null)}
        />
      ) : null}
      {wifiIds ? (
        <BulkWifiDialog
          deviceIds={wifiIds}
          open={wifiIds !== null}
          onOpenChange={(o) => !o && setWifiIds(null)}
        />
      ) : null}
    </div>
  )
}

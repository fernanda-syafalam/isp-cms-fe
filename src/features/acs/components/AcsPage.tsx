import { getRouteApi } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { RotateCwIcon, UploadCloudIcon, WifiIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { useCan } from '@/features/auth'
import { formatDateTime } from '@/lib/format'
import type { AcsDevice } from '@/schemas/acs'

import { useAcsDevices, useBulkAcs } from '../hooks/useAcs'
import { BulkFirmwareDialog } from './BulkFirmwareDialog'
import { BulkWifiDialog } from './BulkWifiDialog'

const routeApi = getRouteApi('/_auth/network/acs')

export function AcsPage() {
  const { q } = routeApi.useSearch()
  const { data, isLoading, isError } = useAcsDevices()
  const canManage = useCan('network.manage')
  const bulk = useBulkAcs()
  const [fwIds, setFwIds] = useState<string[] | null>(null)
  const [wifiIds, setWifiIds] = useState<string[] | null>(null)

  const columns = useMemo<ColumnDef<AcsDevice>[]>(
    () => [
      {
        accessorKey: 'serial',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Serial ONU" />,
        meta: { title: 'Serial ONU' },
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.serial}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Pelanggan',
        meta: { title: 'Pelanggan' },
      },
      { accessorKey: 'model', header: 'Model', meta: { title: 'Model' } },
      {
        accessorKey: 'firmware',
        header: 'Firmware',
        meta: { title: 'Firmware' },
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.firmware}</span>,
      },
      {
        accessorKey: 'rxPowerDbm',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Redaman" />,
        meta: { title: 'Redaman', align: 'right' },
        cell: ({ row }) =>
          row.original.rxPowerDbm == null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span className="font-mono tabular-nums">{row.original.rxPowerDbm} dBm</span>
          ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        meta: { title: 'Status' },
        cell: ({ row }) => (
          <StatusBadge
            tone={row.original.status === 'online' ? 'success' : 'danger'}
            label={row.original.status === 'online' ? 'Online' : 'Offline'}
          />
        ),
      },
      {
        accessorKey: 'lastInform',
        header: 'Inform terakhir',
        meta: { title: 'Inform terakhir' },
        cell: ({ row }) => formatDateTime(row.original.lastInform),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="ONU / TR-069 (GenieACS)"
        description="Kelola CPE pelanggan massal: reboot, firmware, WiFi."
      />

      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada perangkat CPE."
        searchPlaceholder="Cari serial / pelanggan…"
        initialSearch={q}
        enableSelection={canManage}
        bulkActions={(selected) => {
          const ids = selected.map((d) => d.id)
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                disabled={bulk.isPending}
                onClick={() => bulk.mutate({ action: 'reboot', deviceIds: ids })}
              >
                <RotateCwIcon className="size-4" />
                Reboot
              </Button>
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

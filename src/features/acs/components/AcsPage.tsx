import { Link, getRouteApi } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { RotateCwIcon, UploadCloudIcon, WifiIcon } from 'lucide-react'
import { useState } from 'react'

import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/table/data-table'
import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { useCan } from '@/features/auth'
import { useTableQuery } from '@/hooks/useTableQuery'
import { formatDateTime } from '@/lib/format'
import type { AcsDevice } from '@/schemas/acs'

import { useAcsDevices, useBulkAcs } from '../hooks/useAcs'
import { BulkFirmwareDialog } from './BulkFirmwareDialog'
import { BulkWifiDialog } from './BulkWifiDialog'

const routeApi = getRouteApi('/_auth/network/acs')

// Static column defs (no component state). Sortable keys (serial/rxPowerDbm)
// match the backend sort whitelist; the rest are plain headers.
const COLUMNS: ColumnDef<AcsDevice>[] = [
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
    // An ACS device's id is the subscriber id (built from CUSTOMER_FIXTURES).
    cell: ({ row }) => (
      <Link
        to="/customers/$customerId"
        params={{ customerId: row.original.id }}
        className="font-medium hover:underline"
      >
        {row.original.customerName}
      </Link>
    ),
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
]

export function AcsPage() {
  const { q } = routeApi.useSearch()
  const canManage = useCan('network.manage')
  const bulk = useBulkAcs()
  const [fwIds, setFwIds] = useState<string[] | null>(null)
  const [wifiIds, setWifiIds] = useState<string[] | null>(null)

  // ?q= deep-link (e.g. from a customer's connection tab) seeds the search box.
  const table = useTableQuery({ pageSize: 20, initialSearch: q })
  const { data, isLoading, isError } = useAcsDevices({
    q: table.params.q,
    sort: table.params.sort,
    order: table.params.order,
    limit: table.params.limit,
    offset: table.params.offset,
  })
  const total = data?.total ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="ONU / TR-069 (GenieACS)"
        description="Kelola CPE pelanggan massal: reboot, firmware, WiFi."
      />

      <DataTable
        columns={COLUMNS}
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

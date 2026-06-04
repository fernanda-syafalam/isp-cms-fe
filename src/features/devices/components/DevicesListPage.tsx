import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'

import { DataTable } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { formatDateTime, formatNumber } from '@/lib/format'
import type { Device, DeviceStatus } from '@/schemas/device'

import { useDevicesList } from '../hooks/useDevices'

const STATUS_TONE: Record<DeviceStatus, StatusTone> = {
  online: 'success',
  degraded: 'warning',
  offline: 'danger',
}

export function DevicesListPage() {
  const { data, isLoading, isError } = useDevicesList()

  const columns = useMemo<ColumnDef<Device>[]>(
    () => [
      { accessorKey: 'name', header: 'Device' },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => <span className="uppercase">{row.original.type}</span>,
      },
      { accessorKey: 'ipAddress', header: 'IP address' },
      { accessorKey: 'areaName', header: 'Area' },
      {
        accessorKey: 'uptimeHours',
        header: 'Uptime',
        cell: ({ row }) => `${formatNumber(Math.round(row.original.uptimeHours))} h`,
      },
      {
        accessorKey: 'lastSeenAt',
        header: 'Last seen',
        cell: ({ row }) => formatDateTime(row.original.lastSeenAt),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge tone={STATUS_TONE[row.original.status]} label={row.original.status} />
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Network Devices" description="OLT, ONU, and Mikrotik devices." />
      <div className="rounded-lg border border-border bg-card p-4">
        <DataTable
          columns={columns}
          data={data?.items}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="No devices registered."
        />
      </div>
    </div>
  )
}

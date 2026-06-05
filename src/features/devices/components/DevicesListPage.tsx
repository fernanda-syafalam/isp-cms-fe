import type { ColumnDef } from '@tanstack/react-table'
import { statusLabel } from '@/lib/status-label'
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
      { accessorKey: 'name', header: 'Perangkat' },
      {
        accessorKey: 'type',
        header: 'Tipe',
        cell: ({ row }) => <span className="uppercase">{row.original.type}</span>,
      },
      {
        accessorKey: 'ipAddress',
        header: 'Alamat IP',
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.ipAddress}</span>,
      },
      { accessorKey: 'areaName', header: 'Area' },
      {
        accessorKey: 'uptimeHours',
        header: 'Uptime',
        meta: { align: 'right' },
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">
            {formatNumber(Math.round(row.original.uptimeHours))} j
          </span>
        ),
      },
      {
        accessorKey: 'lastSeenAt',
        header: 'Terakhir terlihat',
        cell: ({ row }) => formatDateTime(row.original.lastSeenAt),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge
            tone={STATUS_TONE[row.original.status]}
            label={statusLabel(row.original.status)}
          />
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Perangkat Jaringan" description="Perangkat OLT, ONU, dan Mikrotik." />
      <div className="rounded-lg border border-border bg-card p-4">
        <DataTable
          columns={columns}
          data={data?.items}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="Belum ada perangkat."
        />
      </div>
    </div>
  )
}

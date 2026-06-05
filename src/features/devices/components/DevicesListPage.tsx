import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { DataTable } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDateTime, formatNumber } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Device, DeviceStatus } from '@/schemas/device'

import { useDevicesList } from '../hooks/useDevices'

const STATUS_TONE: Record<DeviceStatus, StatusTone> = {
  online: 'success',
  degraded: 'warning',
  offline: 'danger',
}

const TYPE_OPTIONS = ['all', 'olt', 'onu', 'mikrotik'] as const

// GPON optical health: healthy ≳ −25 dBm, marginal −25…−27, bad < −27.
function rxTone(dbm: number): StatusTone {
  if (dbm >= -25) return 'success'
  if (dbm >= -27) return 'warning'
  return 'danger'
}

export function DevicesListPage() {
  const [type, setType] = useState('all')
  const { data, isLoading, isError } = useDevicesList()

  const items = useMemo(
    () => (data?.items ?? []).filter((d) => type === 'all' || d.type === type),
    [data, type],
  )

  const columns = useMemo<ColumnDef<Device>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Perangkat',
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
        cell: ({ row }) => <span className="uppercase">{row.original.type}</span>,
      },
      {
        accessorKey: 'ipAddress',
        header: 'Alamat IP',
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.ipAddress}</span>,
      },
      { accessorKey: 'areaName', header: 'Area' },
      {
        accessorKey: 'rxPower',
        header: 'Redaman',
        meta: { align: 'right' },
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
      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="sm:w-44" aria-label="Filter tipe">
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
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="Belum ada perangkat."
        />
      </div>
    </div>
  )
}

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
import { formatDateTime } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { WorkOrder, WorkOrderStatus } from '@/schemas/workorder'

import { useWorkOrdersList } from '../hooks/useWorkOrders'

const STATUS_TONE: Record<WorkOrderStatus, StatusTone> = {
  scheduled: 'info',
  in_progress: 'warning',
  done: 'success',
  cancelled: 'neutral',
}

const STATUS_OPTIONS = ['all', 'scheduled', 'in_progress', 'done', 'cancelled'] as const

export function WorkOrdersListPage() {
  const [status, setStatus] = useState('all')
  const { data, isLoading, isError } = useWorkOrdersList({
    status: status === 'all' ? undefined : status,
  })

  const columns = useMemo<ColumnDef<WorkOrder>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Kode',
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.code}</span>,
      },
      {
        accessorKey: 'type',
        header: 'Jenis',
        cell: ({ row }) => statusLabel(row.original.type),
      },
      { accessorKey: 'customerName', header: 'Pelanggan' },
      {
        accessorKey: 'technician',
        header: 'Teknisi',
        cell: ({ row }) => row.original.technician ?? '—',
      },
      {
        accessorKey: 'scheduledAt',
        header: 'Jadwal',
        cell: ({ row }) => formatDateTime(row.original.scheduledAt),
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
      <PageHeader
        title="Work Order"
        description="Instalasi, gangguan, dan pencabutan oleh tim teknisi."
      />
      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-44" aria-label="Filter status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'all' ? 'Semua status' : statusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DataTable
          columns={columns}
          data={data?.items}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="Belum ada work order."
        />
      </div>
    </div>
  )
}

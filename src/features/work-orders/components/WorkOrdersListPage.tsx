import type { ColumnDef } from '@tanstack/react-table'
import { DownloadIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

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
import { downloadCsv } from '@/lib/csv'
import { formatDateTime } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { WorkOrder, WorkOrderStatus } from '@/schemas/workorder'

import { useWorkOrdersList } from '../hooks/useWorkOrders'
import { WorkOrderRowActions } from './WorkOrderRowActions'

const STATUS_TONE: Record<WorkOrderStatus, StatusTone> = {
  scheduled: 'info',
  in_progress: 'warning',
  done: 'success',
  cancelled: 'neutral',
}

const STATUS_OPTIONS = ['all', 'scheduled', 'in_progress', 'done', 'cancelled'] as const

const toCsvRow = (w: WorkOrder) => ({
  Kode: w.code,
  Jenis: statusLabel(w.type),
  Pelanggan: w.customerName,
  Teknisi: w.technician ?? '—',
  Jadwal: formatDateTime(w.scheduledAt),
  Status: statusLabel(w.status),
})

export function WorkOrdersListPage() {
  const [status, setStatus] = useState('all')
  const { data, isLoading, isError } = useWorkOrdersList({
    status: status === 'all' ? undefined : status,
  })

  const columns = useMemo<ColumnDef<WorkOrder>[]>(
    () => [
      {
        accessorKey: 'code',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Kode" />,
        meta: { title: 'Kode' },
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.code}</span>,
      },
      {
        accessorKey: 'type',
        header: 'Jenis',
        meta: { title: 'Jenis' },
        cell: ({ row }) => statusLabel(row.original.type),
      },
      {
        accessorKey: 'customerName',
        header: 'Pelanggan',
        meta: { title: 'Pelanggan' },
      },
      {
        accessorKey: 'technician',
        header: 'Teknisi',
        meta: { title: 'Teknisi' },
        cell: ({ row }) => row.original.technician ?? '—',
      },
      {
        accessorKey: 'scheduledAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Jadwal" />,
        meta: { title: 'Jadwal' },
        cell: ({ row }) => formatDateTime(row.original.scheduledAt),
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
        cell: ({ row }) => <WorkOrderRowActions workOrder={row.original} />,
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
      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada work order."
        searchPlaceholder="Cari work order…"
        toolbar={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 w-40" aria-label="Filter status">
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
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={!data?.items.length}
            onClick={() => downloadCsv('work-order', (data?.items ?? []).map(toCsvRow))}
          >
            <DownloadIcon className="size-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        }
      />
    </div>
  )
}

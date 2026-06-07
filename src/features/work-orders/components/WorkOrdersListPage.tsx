import { Link, getRouteApi } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { DownloadIcon } from 'lucide-react'
import { useMemo } from 'react'

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

const TYPE_OPTIONS = ['all', 'install', 'repair', 'dismantle'] as const

const toCsvRow = (w: WorkOrder) => ({
  Kode: w.code,
  Jenis: statusLabel(w.type),
  Pelanggan: w.customerName,
  Teknisi: w.technician ?? '—',
  Jadwal: formatDateTime(w.scheduledAt),
  Status: statusLabel(w.status),
})

const routeApi = getRouteApi('/_auth/work-orders')

export function WorkOrdersListPage() {
  const { status: statusParam, type: typeParam } = routeApi.useSearch()
  const status = statusParam ?? 'all'
  const type = typeParam ?? 'all'
  const navigate = routeApi.useNavigate()
  // Build a search object with only the keys that are set (omit when "all") so
  // it satisfies validateSearch under exactOptionalPropertyTypes.
  const buildSearch = (s?: string, t?: string) => ({
    ...(s ? { status: s } : {}),
    ...(t ? { type: t } : {}),
  })
  const setStatus = (value: string) =>
    navigate({
      search: buildSearch(value === 'all' ? undefined : value, typeParam),
    })
  const setType = (value: string) =>
    navigate({
      search: buildSearch(statusParam, value === 'all' ? undefined : value),
    })
  const { data, isLoading, isError } = useWorkOrdersList({
    status: status === 'all' ? undefined : status,
  })
  // Type filter is applied client-side (the list handler filters by status).
  const items = useMemo(() => {
    const list = data?.items ?? []
    return type === 'all' ? list : list.filter((w) => w.type === type)
  }, [data, type])

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
        cell: ({ row }) =>
          row.original.customerId ? (
            <Link
              to="/customers/$customerId"
              params={{ customerId: row.original.customerId }}
              className="font-medium hover:underline"
            >
              {row.original.customerName}
            </Link>
          ) : (
            row.original.customerName
          ),
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
        data={items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada work order."
        searchPlaceholder="Cari work order…"
        toolbar={
          <div className="flex items-center gap-2">
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
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-8 w-40" aria-label="Filter jenis">
                <SelectValue placeholder="Jenis" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t === 'all' ? 'Semua jenis' : statusLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={!items.length}
            onClick={() => downloadCsv('work-order', items.map(toCsvRow))}
          >
            <DownloadIcon className="size-4" />
            <span className="hidden sm:inline">Ekspor</span>
          </Button>
        }
      />
    </div>
  )
}

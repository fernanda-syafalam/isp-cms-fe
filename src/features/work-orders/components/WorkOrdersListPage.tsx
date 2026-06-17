import { Link, getRouteApi } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { DownloadIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { WorkOrderFilter } from '@/api/workorders'
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
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { WorkOrder, WorkOrderStatus } from '@/schemas/workorder'

import { useExportWorkOrders, useWorkOrdersList } from '../hooks/useWorkOrders'
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

// Static column defs (no component state): sortable keys (code/scheduledAt/
// status) match the backend sort whitelist.
const COLUMNS: ColumnDef<WorkOrder>[] = [
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
]

const routeApi = getRouteApi('/_auth/work-orders')

export function WorkOrdersListPage() {
  const { status: statusParam, type: typeParam } = routeApi.useSearch()
  const status = statusParam ?? 'all'
  const type = typeParam ?? 'all'
  const navigate = routeApi.useNavigate()
  const table = useTableQuery({ pageSize: 20 })
  const exportWorkOrders = useExportWorkOrders()
  const [isExporting, setIsExporting] = useState(false)

  // Build a search object with only the keys that are set (omit when "all") so
  // it satisfies validateSearch under exactOptionalPropertyTypes. Changing a
  // URL filter resets the page so the user is never on an out-of-range page.
  const buildSearch = (s?: string, t?: string) => ({
    ...(s ? { status: s } : {}),
    ...(t ? { type: t } : {}),
  })
  const setStatus = (value: string) => {
    table.resetPage()
    navigate({
      search: buildSearch(value === 'all' ? undefined : value, typeParam),
    })
  }
  const setType = (value: string) => {
    table.resetPage()
    navigate({
      search: buildSearch(statusParam, value === 'all' ? undefined : value),
    })
  }

  // Equality filters come from the URL; search/sort/paging from the table.
  const baseFilter: WorkOrderFilter = {
    ...(status === 'all' ? {} : { status }),
    ...(type === 'all' ? {} : { type }),
    q: table.params.q,
    sort: table.params.sort,
    order: table.params.order,
  }
  const { data, isLoading, isError } = useWorkOrdersList({
    ...baseFilter,
    limit: table.params.limit,
    offset: table.params.offset,
  })
  const items = data?.items ?? []
  const total = data?.total ?? 0

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportWorkOrders(baseFilter)
      downloadCsv('work-order', result.items.map(toCsvRow))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Work Order"
        description="Instalasi, gangguan, dan pencabutan oleh tim teknisi."
      />
      <DataTable
        columns={COLUMNS}
        data={items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada work order."
        searchPlaceholder="Cari work order…"
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
            disabled={!total || isExporting}
            onClick={handleExport}
          >
            <DownloadIcon className="size-4" />
            <span className="hidden sm:inline">Ekspor</span>
          </Button>
        }
      />
    </div>
  )
}

import { Link, getRouteApi } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import {
  CalendarClockIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  ClockIcon,
  DownloadIcon,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { WorkOrderFilter } from '@/api/workorders'
import { FilterTabs, type FilterTabItem } from '@/components/shared/filter-tabs'
import { KpiCard } from '@/components/shared/kpi-card'
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
import { WorkOrderDetailSheet } from './WorkOrderDetailSheet'
import { WorkOrderRowActions } from './WorkOrderRowActions'

const STATUS_TONE: Record<WorkOrderStatus, StatusTone> = {
  scheduled: 'info',
  in_progress: 'warning',
  done: 'success',
  cancelled: 'neutral',
}

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
  const [openWo, setOpenWo] = useState<WorkOrder | null>(null)

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
  const { data, isLoading, isError, refetch } = useWorkOrdersList({
    ...baseFilter,
    limit: table.params.limit,
    offset: table.params.offset,
  })
  const items = data?.items ?? []
  const total = data?.total ?? 0
  const summary = data?.summary
  const by = summary?.byStatus

  const statusTabs: FilterTabItem[] = [
    { value: 'all', label: 'Semua', count: summary?.total },
    {
      value: 'scheduled',
      label: statusLabel('scheduled'),
      count: by?.scheduled,
    },
    {
      value: 'in_progress',
      label: statusLabel('in_progress'),
      count: by?.in_progress,
    },
    { value: 'done', label: statusLabel('done'), count: by?.done },
    {
      value: 'cancelled',
      label: statusLabel('cancelled'),
      count: by?.cancelled,
    },
  ]

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total work order"
          value={summary?.total ?? 0}
          hint="seluruh WO"
          icon={ClipboardListIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Terjadwal"
          value={by?.scheduled ?? 0}
          hint="menunggu kunjungan"
          icon={CalendarClockIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Dalam proses"
          value={by?.in_progress ?? 0}
          hint="sedang dikerjakan"
          accent="amber"
          icon={ClockIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Selesai"
          value={by?.done ?? 0}
          hint="WO tuntas"
          icon={CheckCircle2Icon}
          isLoading={isLoading}
          isError={isError}
        />
      </div>

      <FilterTabs
        ariaLabel="Filter status work order"
        value={status}
        onValueChange={setStatus}
        items={statusTabs}
      />

      <DataTable
        columns={COLUMNS}
        data={items}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        onRowClick={(wo) => setOpenWo(wo)}
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
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-11 w-full sm:h-8 sm:w-40" aria-label="Filter jenis">
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
        }
      />

      <WorkOrderDetailSheet
        workOrder={openWo}
        open={openWo !== null}
        onOpenChange={(open) => {
          if (!open) setOpenWo(null)
        }}
      />
    </div>
  )
}

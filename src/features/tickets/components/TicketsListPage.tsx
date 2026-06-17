import { Link, getRouteApi } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { CheckCircle2Icon, DownloadIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { TicketFilter } from '@/api/tickets'
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
import { useCan } from '@/features/auth'
import { useTableQuery } from '@/hooks/useTableQuery'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime } from '@/lib/format'
import { slaState } from '@/lib/sla'
import { statusLabel } from '@/lib/status-label'
import type { Ticket, TicketPriority, TicketStatus } from '@/schemas/ticket'

import { CreateTicketDialog } from './CreateTicketDialog'
import { TicketRowActions } from './TicketRowActions'
import { useBulkResolveTickets, useExportTickets, useTicketsList } from '../hooks/useTickets'

const STATUS_TONE: Record<TicketStatus, StatusTone> = {
  open: 'info',
  in_progress: 'warning',
  resolved: 'success',
  breached: 'danger',
}

const PRIORITY_TONE: Record<TicketPriority, StatusTone> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
}

const STATUS_OPTIONS = ['all', 'open', 'in_progress', 'resolved', 'breached'] as const

const toCsvRow = (t: Ticket) => ({
  Kode: t.code,
  Subjek: t.subject,
  Pelanggan: t.customerName,
  Prioritas: statusLabel(t.priority),
  Status: statusLabel(t.status),
  'Batas SLA': formatDateTime(t.slaDueAt),
})

const routeApi = getRouteApi('/_auth/tickets/')

// Static column defs (no component state): sortable keys (code/status) match
// the backend sort whitelist; the table delegates sorting to the server.
const COLUMNS: ColumnDef<Ticket>[] = [
  {
    accessorKey: 'code',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kode" />,
    meta: { title: 'Kode' },
    cell: ({ row }) => (
      <Link
        to="/tickets/$ticketId"
        params={{ ticketId: row.original.id }}
        className="font-medium font-mono text-sm hover:underline"
      >
        {row.original.code}
      </Link>
    ),
  },
  {
    accessorKey: 'subject',
    header: 'Subjek',
    meta: { title: 'Subjek' },
    cell: ({ row }) => <span className="font-medium">{row.original.subject}</span>,
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
    accessorKey: 'priority',
    header: 'Prioritas',
    meta: { title: 'Prioritas' },
    cell: ({ row }) => (
      <StatusBadge
        tone={PRIORITY_TONE[row.original.priority]}
        label={statusLabel(row.original.priority)}
        dot={false}
      />
    ),
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
    id: 'sla',
    header: 'SLA',
    meta: { title: 'SLA' },
    cell: ({ row }) => {
      const sla = slaState(row.original.status, row.original.slaDueAt, Date.now())
      return (
        <div className="flex flex-col gap-0.5">
          <StatusBadge tone={sla.tone} label={sla.label} dot={!sla.breached} />
          <span className="text-muted-foreground text-xs">
            {formatDateTime(row.original.slaDueAt)}
          </span>
        </div>
      )
    },
  },
  {
    id: 'actions',
    meta: { align: 'right' },
    enableHiding: false,
    cell: ({ row }) => <TicketRowActions ticket={row.original} />,
  },
]

export function TicketsListPage() {
  const { status: statusParam } = routeApi.useSearch()
  const status = statusParam ?? 'all'
  const navigate = routeApi.useNavigate()
  const canManage = useCan('tickets.manage')
  const table = useTableQuery({ pageSize: 20 })
  const bulkResolve = useBulkResolveTickets()
  const exportTickets = useExportTickets()
  const [isExporting, setIsExporting] = useState(false)

  // Status lives in the URL (deep-link); changing it rewinds to page 1.
  const setStatus = (value: string) => {
    table.resetPage()
    navigate({ search: value === 'all' ? {} : { status: value } })
  }

  // The status filter drives the server query; search/sort/paging from the table.
  const baseFilter: TicketFilter = {
    ...(status === 'all' ? {} : { status }),
    q: table.params.q,
    sort: table.params.sort,
    order: table.params.order,
  }
  const { data, isLoading, isError } = useTicketsList({
    ...baseFilter,
    limit: table.params.limit,
    offset: table.params.offset,
  })
  const total = data?.total ?? 0

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportTickets(baseFilter)
      downloadCsv('tiket', result.items.map(toCsvRow))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Tiket Dukungan" description="Keluhan pelanggan dan pelacakan SLA." />
      <DataTable
        columns={COLUMNS}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada tiket."
        searchPlaceholder="Cari tiket…"
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
          <>
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
            <CreateTicketDialog />
          </>
        }
        enableSelection
        bulkActions={(selected) => {
          const open = selected.filter((t) => t.status === 'open' || t.status === 'in_progress')
          return (
            <>
              {canManage && open.length > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={bulkResolve.isPending}
                  onClick={() => bulkResolve.mutate(open.map((t) => t.id))}
                >
                  <CheckCircle2Icon className="size-4" />
                  Tandai selesai ({open.length})
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => downloadCsv('tiket-terpilih', selected.map(toCsvRow))}
              >
                <DownloadIcon className="size-4" />
                Export terpilih
              </Button>
            </>
          )
        }}
      />
    </div>
  )
}

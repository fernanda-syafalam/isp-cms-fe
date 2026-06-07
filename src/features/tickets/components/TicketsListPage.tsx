import { Link, getRouteApi } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { CheckCircle2Icon, DownloadIcon } from 'lucide-react'
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
import { useCan } from '@/features/auth'
import { downloadCsv } from '@/lib/csv'
import { formatDateTime } from '@/lib/format'
import { slaState } from '@/lib/sla'
import { statusLabel } from '@/lib/status-label'
import type { Ticket, TicketPriority, TicketStatus } from '@/schemas/ticket'

import { CreateTicketDialog } from './CreateTicketDialog'
import { TicketRowActions } from './TicketRowActions'
import { useBulkResolveTickets, useTicketsList } from '../hooks/useTickets'

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

export function TicketsListPage() {
  const { status: statusParam } = routeApi.useSearch()
  const status = statusParam ?? 'all'
  const navigate = routeApi.useNavigate()
  const setStatus = (value: string) =>
    navigate({ search: value === 'all' ? {} : { status: value } })
  const canManage = useCan('tickets.manage')
  const bulkResolve = useBulkResolveTickets()
  const { data, isLoading, isError } = useTicketsList({
    status: status === 'all' ? undefined : status,
  })

  const columns = useMemo<ColumnDef<Ticket>[]>(
    () => [
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
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Tiket Dukungan" description="Keluhan pelanggan dan pelacakan SLA." />
      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada tiket."
        searchPlaceholder="Cari tiket…"
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
              disabled={!data?.items.length}
              onClick={() => downloadCsv('tiket', (data?.items ?? []).map(toCsvRow))}
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

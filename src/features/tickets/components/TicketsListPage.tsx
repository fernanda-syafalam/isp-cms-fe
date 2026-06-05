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
import type { Ticket, TicketPriority, TicketStatus } from '@/schemas/ticket'

import { CreateTicketDialog } from './CreateTicketDialog'
import { useTicketsList } from '../hooks/useTickets'

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

export function TicketsListPage() {
  const [status, setStatus] = useState('all')
  const { data, isLoading, isError } = useTicketsList({
    status: status === 'all' ? undefined : status,
  })

  const columns = useMemo<ColumnDef<Ticket>[]>(
    () => [
      {
        accessorKey: 'code',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Kode" />,
        meta: { title: 'Kode' },
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.code}</span>,
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
        accessorKey: 'slaDueAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Batas SLA" />,
        meta: { title: 'Batas SLA' },
        cell: ({ row }) => formatDateTime(row.original.slaDueAt),
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
              <span className="hidden sm:inline">Export</span>
            </Button>
            <CreateTicketDialog />
          </>
        }
      />
    </div>
  )
}

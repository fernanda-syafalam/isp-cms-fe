import type { ColumnDef } from '@tanstack/react-table'
import { statusLabel } from '@/lib/status-label'
import { useMemo } from 'react'

import { DataTable } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { formatDateTime } from '@/lib/format'
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

export function TicketsListPage() {
  const { data, isLoading, isError } = useTicketsList()

  const columns = useMemo<ColumnDef<Ticket>[]>(
    () => [
      { accessorKey: 'code', header: 'Kode' },
      { accessorKey: 'subject', header: 'Subjek' },
      { accessorKey: 'customerName', header: 'Pelanggan' },
      {
        accessorKey: 'priority',
        header: 'Prioritas',
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
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge
            tone={STATUS_TONE[row.original.status]}
            label={statusLabel(row.original.status)}
          />
        ),
      },
      {
        accessorKey: 'slaDueAt',
        header: 'Batas SLA',
        cell: ({ row }) => formatDateTime(row.original.slaDueAt),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tiket Dukungan"
        description="Keluhan pelanggan dan pelacakan SLA."
        actions={<CreateTicketDialog />}
      />
      <div className="rounded-lg border border-border bg-card p-4">
        <DataTable
          columns={columns}
          data={data?.items}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="Belum ada tiket."
        />
      </div>
    </div>
  )
}

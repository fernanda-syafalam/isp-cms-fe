import type { ColumnDef } from '@tanstack/react-table'
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
      { accessorKey: 'code', header: 'Code' },
      { accessorKey: 'subject', header: 'Subject' },
      { accessorKey: 'customerName', header: 'Customer' },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ row }) => (
          <StatusBadge
            tone={PRIORITY_TONE[row.original.priority]}
            label={row.original.priority}
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
            label={row.original.status.replace('_', ' ')}
          />
        ),
      },
      {
        accessorKey: 'slaDueAt',
        header: 'SLA due',
        cell: ({ row }) => formatDateTime(row.original.slaDueAt),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Tickets"
        description="Customer issues and SLA tracking."
        actions={<CreateTicketDialog />}
      />
      <div className="rounded-lg border border-border bg-card p-4">
        <DataTable
          columns={columns}
          data={data?.items}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="No tickets open."
        />
      </div>
    </div>
  )
}

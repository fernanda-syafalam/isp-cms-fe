import { useNavigate } from '@tanstack/react-router'
import { CheckCircle2Icon, HandCoinsIcon, PlayIcon, PlusIcon } from 'lucide-react'

import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { useCan } from '@/features/auth'
import { slaState } from '@/lib/sla'
import { statusLabel } from '@/lib/status-label'
import type { Ticket, TicketStatus } from '@/schemas/ticket'

import { useCreateWorkOrderFromTicket, useUpdateTicket } from '../hooks/useTickets'

const STATUS_TONE: Record<TicketStatus, StatusTone> = {
  open: 'info',
  in_progress: 'warning',
  resolved: 'success',
  breached: 'danger',
}

// SLA + status badges and the ticket workflow actions (start, resolve, create
// work order, SLA credit) for the detail page header.
export function TicketHeaderActions({ ticket }: { ticket: Ticket }) {
  const canManage = useCan('tickets.manage')
  const canBill = useCan('billing.run')
  const navigate = useNavigate()
  const update = useUpdateTicket(ticket.id)
  const createWo = useCreateWorkOrderFromTicket(ticket.id)

  const sla = slaState(ticket.status, ticket.slaDueAt, Date.now())
  const canStart = ticket.status === 'open'
  const canResolve = ticket.status === 'open' || ticket.status === 'in_progress'

  return (
    <div className="flex items-center gap-2">
      <StatusBadge tone={sla.tone} label={sla.label} dot={!sla.breached} />
      <StatusBadge tone={STATUS_TONE[ticket.status]} label={statusLabel(ticket.status)} />
      {canManage ? (
        <>
          {canStart ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => update.mutate({ status: 'in_progress' })}
            >
              <PlayIcon className="size-4" />
              Mulai
            </Button>
          ) : null}
          {canResolve ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => update.mutate({ status: 'resolved' })}
            >
              <CheckCircle2Icon className="size-4" />
              Selesai
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            disabled={createWo.isPending}
            onClick={() => createWo.mutate()}
          >
            <PlusIcon className="size-4" />
            Buat Work Order
          </Button>
        </>
      ) : null}
      {canBill ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            navigate({
              to: '/sla-credits',
              search: {
                customer: ticket.customerName,
                ticket: ticket.code,
              },
            })
          }
        >
          <HandCoinsIcon className="size-4" />
          Kredit SLA
        </Button>
      ) : null}
    </div>
  )
}

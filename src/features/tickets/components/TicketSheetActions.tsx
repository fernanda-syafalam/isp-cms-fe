import { useNavigate } from '@tanstack/react-router'
import { CheckCircle2Icon, HandCoinsIcon, PlayIcon, PlusIcon } from 'lucide-react'

import { DetailActionBar } from '@/components/shared/detail-sheet'
import { Button } from '@/components/ui/button'
import { useCan } from '@/features/auth'
import type { Ticket } from '@/schemas/ticket'

import { useCreateWorkOrderFromTicket, useUpdateTicket } from '../hooks/useTickets'

// Workflow action bar for the ticket quick-view drawer: start, resolve, create
// work order (gated tickets.manage), and SLA credit (gated billing.run).
// Renders nothing when the viewer can do neither.
export function TicketSheetActions({ ticket }: { ticket: Ticket }) {
  const canManage = useCan('tickets.manage')
  const canBill = useCan('billing.run')
  const navigate = useNavigate()
  const update = useUpdateTicket(ticket.id)
  const createWo = useCreateWorkOrderFromTicket(ticket.id)

  if (!canManage && !canBill) return null

  const canStart = ticket.status === 'open'
  const canResolve = ticket.status === 'open' || ticket.status === 'in_progress'

  return (
    <DetailActionBar>
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
            Work Order
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
    </DetailActionBar>
  )
}

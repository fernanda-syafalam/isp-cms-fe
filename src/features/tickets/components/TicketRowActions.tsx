import { CheckCircle2Icon, MoreHorizontalIcon, PencilIcon, PlayIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCan } from '@/features/auth'
import type { Ticket } from '@/schemas/ticket'

import { useUpdateTicket } from '../hooks/useTickets'
import { EditTicketDialog } from './EditTicketDialog'

export function TicketRowActions({ ticket }: { ticket: Ticket }) {
  const [editOpen, setEditOpen] = useState(false)
  const canManage = useCan('tickets.manage')
  const update = useUpdateTicket(ticket.id)

  if (!canManage) return null

  const canStart = ticket.status === 'open'
  const canResolve = ticket.status === 'open' || ticket.status === 'in_progress'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label="Aksi baris">
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {canStart ? (
            <DropdownMenuItem onSelect={() => update.mutate({ status: 'in_progress' })}>
              <PlayIcon className="size-4" />
              Mulai proses
            </DropdownMenuItem>
          ) : null}
          {canResolve ? (
            <DropdownMenuItem onSelect={() => update.mutate({ status: 'resolved' })}>
              <CheckCircle2Icon className="size-4" />
              Tandai selesai
            </DropdownMenuItem>
          ) : null}
          {canStart || canResolve ? <DropdownMenuSeparator /> : null}
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <PencilIcon className="size-4" />
            Edit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditTicketDialog ticket={ticket} open={editOpen} onOpenChange={setEditOpen} />
    </>
  )
}

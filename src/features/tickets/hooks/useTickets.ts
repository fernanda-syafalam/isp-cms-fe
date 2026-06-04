import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { type TicketFilter, createTicket, listTickets } from '@/api/tickets'
import { getErrorMessage } from '@/lib/errors'
import type { CreateTicketInput } from '@/schemas/ticket'

export function useTicketsList(filter: TicketFilter = {}) {
  return useQuery({
    queryKey: ['tickets', 'list', filter] as const,
    queryFn: () => listTickets(filter),
  })
}

export function useCreateTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTicketInput) => createTicket(input),
    onSuccess: (ticket) => {
      qc.invalidateQueries({ queryKey: ['tickets'] })
      toast.success(`Ticket ${ticket.code} created`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

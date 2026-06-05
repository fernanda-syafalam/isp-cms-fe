import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { type TicketFilter, createTicket, listTickets, updateTicket } from '@/api/tickets'
import { getErrorMessage } from '@/lib/errors'
import type { CreateTicketInput, UpdateTicketInput } from '@/schemas/ticket'

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
      toast.success(`Tiket ${ticket.code} dibuat`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateTicket(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateTicketInput) => updateTicket(id, input),
    onSuccess: (ticket) => {
      qc.invalidateQueries({ queryKey: ['tickets'] })
      toast.success(`Tiket ${ticket.code} diperbarui`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

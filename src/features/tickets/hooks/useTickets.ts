import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  type TicketFilter,
  addTicketComment,
  createTicket,
  createWorkOrderFromTicket,
  getTicket,
  listTicketEvents,
  listTickets,
  updateTicket,
} from '@/api/tickets'
import { getErrorMessage } from '@/lib/errors'
import type { AddCommentInput, CreateTicketInput, UpdateTicketInput } from '@/schemas/ticket'

export function useTicket(id: string) {
  return useQuery({
    queryKey: ['tickets', 'detail', id] as const,
    queryFn: () => getTicket(id),
  })
}

export function useTicketEvents(id: string) {
  return useQuery({
    queryKey: ['tickets', id, 'events'] as const,
    queryFn: () => listTicketEvents(id),
  })
}

export function useAddComment(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AddCommentInput) => addTicketComment(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets', id, 'events'] })
      toast.success('Komentar ditambahkan')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useCreateWorkOrderFromTicket(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => createWorkOrderFromTicket(id),
    onSuccess: (wo) => {
      qc.invalidateQueries({ queryKey: ['tickets', id, 'events'] })
      qc.invalidateQueries({ queryKey: ['work-orders'] })
      toast.success(`Work order ${wo.code} dibuat`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

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

// Bulk resolve selected tickets (one summary toast).
export function useBulkResolveTickets() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => updateTicket(id, { status: 'resolved' })))
      return ids.length
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ['tickets'] })
      toast.success(`${count} tiket ditandai selesai`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

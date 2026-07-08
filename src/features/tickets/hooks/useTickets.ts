import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  type TicketFilter,
  TICKET_EXPORT_LIMIT,
  addTicketComment,
  createTicket,
  createWorkOrderFromTicket,
  getTicket,
  listTicketEvents,
  listTickets,
  updateTicket,
} from '@/api/tickets'
import { workOrderKeys } from '@/features/work-orders/queries/keys'
import { getErrorMessage } from '@/lib/errors'
import type { AddCommentInput, CreateTicketInput, UpdateTicketInput } from '@/schemas/ticket'
import { ticketKeys } from '../queries/keys'

export function useTicket(id: string) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => getTicket(id),
  })
}

export function useTicketEvents(id: string) {
  return useQuery({
    queryKey: ticketKeys.events(id),
    queryFn: () => listTicketEvents(id),
  })
}

export function useAddComment(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AddCommentInput) => addTicketComment(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.events(id) })
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
      qc.invalidateQueries({ queryKey: ticketKeys.events(id) })
      qc.invalidateQueries({ queryKey: workOrderKeys.all })
      toast.success(`Work order ${wo.code} dibuat`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useTicketsList(filter: TicketFilter = {}) {
  return useQuery({
    queryKey: ticketKeys.list(filter),
    queryFn: () => listTickets(filter),
  })
}

/**
 * Returns a callback that fetches the full filtered ticket set (one max-size
 * page) for CSV export. With server pagination the table holds only the current
 * page, so export must re-query without the page window.
 */
export function useExportTickets() {
  const qc = useQueryClient()
  return (filter: TicketFilter = {}) => {
    const exportFilter: TicketFilter = {
      ...filter,
      limit: TICKET_EXPORT_LIMIT,
      offset: 0,
    }
    return qc.fetchQuery({
      queryKey: ticketKeys.list(exportFilter),
      queryFn: () => listTickets(exportFilter),
    })
  }
}

export function useCreateTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTicketInput) => createTicket(input),
    onSuccess: (ticket) => {
      qc.invalidateQueries({ queryKey: ticketKeys.all })
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
      qc.invalidateQueries({ queryKey: ticketKeys.all })
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
      qc.invalidateQueries({ queryKey: ticketKeys.all })
      toast.success(`${count} tiket ditandai selesai`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

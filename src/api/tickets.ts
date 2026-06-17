import { api } from './client'
import {
  type AddCommentInput,
  type CreateTicketInput,
  type Ticket,
  type TicketEventList,
  TicketEventListSchema,
  TicketListSchema,
  TicketSchema,
  type TicketList,
  type UpdateTicketInput,
} from '@/schemas/ticket'
import { type WorkOrder, WorkOrderSchema } from '@/schemas/workorder'

export type TicketFilter = {
  q?: string | undefined
  status?: string | undefined
  sort?: string | undefined
  order?: 'asc' | 'desc' | undefined
  limit?: number | undefined
  offset?: number | undefined
}

// Backend caps a page at 200 rows; the CSV export pulls a single max-size page
// so it covers the full filtered set without a paging loop.
export const TICKET_EXPORT_LIMIT = 200

export async function listTickets(filter: TicketFilter = {}): Promise<TicketList> {
  const searchParams = new URLSearchParams()
  if (filter.q) searchParams.set('q', filter.q)
  if (filter.status) searchParams.set('status', filter.status)
  if (filter.sort) searchParams.set('sort', filter.sort)
  if (filter.order) searchParams.set('order', filter.order)
  if (filter.limit !== undefined) searchParams.set('limit', String(filter.limit))
  if (filter.offset !== undefined) searchParams.set('offset', String(filter.offset))
  const json = await api.get('tickets', { searchParams }).json()
  return TicketListSchema.parse(json)
}

export async function getTicket(id: string): Promise<Ticket> {
  const json = await api.get(`tickets/${id}`).json()
  return TicketSchema.parse(json)
}

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const json = await api.post('tickets', { json: input }).json()
  return TicketSchema.parse(json)
}

// Update a ticket: assign, transition status, edit subject/priority.
export async function updateTicket(id: string, input: UpdateTicketInput): Promise<Ticket> {
  const json = await api.patch(`tickets/${id}`, { json: input }).json()
  return TicketSchema.parse(json)
}

export async function listTicketEvents(id: string): Promise<TicketEventList> {
  const json = await api.get(`tickets/${id}/events`).json()
  return TicketEventListSchema.parse(json)
}

export async function addTicketComment(id: string, input: AddCommentInput): Promise<void> {
  await api.post(`tickets/${id}/comments`, { json: input })
}

// Dispatch a repair work order from a ticket.
export async function createWorkOrderFromTicket(id: string): Promise<WorkOrder> {
  const json = await api.post(`tickets/${id}/work-order`).json()
  return WorkOrderSchema.parse(json)
}

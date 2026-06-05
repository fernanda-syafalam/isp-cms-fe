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
  status?: string | undefined
}

export async function listTickets(filter: TicketFilter = {}): Promise<TicketList> {
  const searchParams = new URLSearchParams()
  if (filter.status) searchParams.set('status', filter.status)
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

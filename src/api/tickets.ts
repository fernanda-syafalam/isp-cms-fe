import { api } from './client'
import {
  type CreateTicketInput,
  type Ticket,
  TicketListSchema,
  TicketSchema,
  type TicketList,
  type UpdateTicketInput,
} from '@/schemas/ticket'

export type TicketFilter = {
  status?: string | undefined
}

export async function listTickets(filter: TicketFilter = {}): Promise<TicketList> {
  const searchParams = new URLSearchParams()
  if (filter.status) searchParams.set('status', filter.status)
  const json = await api.get('tickets', { searchParams }).json()
  return TicketListSchema.parse(json)
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

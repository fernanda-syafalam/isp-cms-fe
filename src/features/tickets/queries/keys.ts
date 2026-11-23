import type { TicketFilter } from '@/api/tickets'

const root = ['tickets'] as const

export const ticketKeys = {
  all: root,
  lists: () => [...root, 'list'] as const,
  list: (filter: TicketFilter) => [...root, 'list', filter] as const,
  details: () => [...root, 'detail'] as const,
  detail: (id: string) => [...root, 'detail', id] as const,
  events: (id: string) => [...root, id, 'events'] as const,
  // customerId may be undefined while the caller's source id is still loading
  // (the query is disabled until then).
  byCustomer: (customerId: string | undefined) => [...root, 'by-customer', customerId] as const,
}

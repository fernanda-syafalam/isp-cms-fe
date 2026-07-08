import type { TicketFilter } from '@/api/tickets'

const root = ['tickets'] as const

export const ticketKeys = {
  all: root,
  lists: () => [...root, 'list'] as const,
  list: (filter: TicketFilter) => [...root, 'list', filter] as const,
  details: () => [...root, 'detail'] as const,
  detail: (id: string) => [...root, 'detail', id] as const,
  events: (id: string) => [...root, id, 'events'] as const,
  // customerName may be undefined while the caller's source id is still loading
  // (the query is disabled until then); the key mirrors the previous literal.
  byCustomer: (customerName: string | undefined) => [...root, 'by-customer', customerName] as const,
}

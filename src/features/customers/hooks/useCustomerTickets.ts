import { useQuery } from '@tanstack/react-query'

import { listTickets } from '@/api/tickets'
import { ticketKeys } from '@/features/tickets/queries/keys'

const RECENT_LIMIT = 8

// Tickets for one customer. The server filters by `customerId`. The client-side
// filter + slice is only a safety net for an older backend that ignores the
// param (no `limit` is sent, as such a backend would obey it and return rows of
// all customers): it matches `customerId`, and falls back to the name for rows
// with a null `customerId`. The new backend returns no unlinked tickets.
export function useCustomerTickets(customerId: string | undefined, customerName?: string) {
  return useQuery({
    queryKey: ticketKeys.byCustomer(customerId),
    queryFn: () => listTickets({ customerId }),
    enabled: Boolean(customerId),
    select: (data) =>
      data.items
        .filter((t) =>
          t.customerId !== null ? t.customerId === customerId : t.customerName === customerName,
        )
        .slice(0, RECENT_LIMIT),
  })
}

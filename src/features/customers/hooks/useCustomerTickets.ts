import { useQuery } from '@tanstack/react-query'

import { listTickets } from '@/api/tickets'

// Tickets for one customer (reads the tickets API, filters client-side by name;
// the real backend will expose a per-customer endpoint later).
export function useCustomerTickets(customerName: string | undefined) {
  return useQuery({
    queryKey: ['tickets', 'by-customer', customerName] as const,
    queryFn: () => listTickets(),
    enabled: Boolean(customerName),
    select: (data) => data.items.filter((t) => t.customerName === customerName).slice(0, 8),
  })
}

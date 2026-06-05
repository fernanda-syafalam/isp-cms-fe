import { useQuery } from '@tanstack/react-query'

import { listPayments } from '@/api/payments'
import { listWorkOrders } from '@/api/workorders'

// Recent payments for the dashboard "Pembayaran terbaru" widget.
export function useRecentPayments(limit = 5) {
  return useQuery({
    queryKey: ['payments', 'recent', limit] as const,
    queryFn: () => listPayments(),
    select: (data) => data.items.slice(0, limit),
  })
}

// Upcoming installs (scheduled install work orders) for the dashboard.
export function useUpcomingInstalls(limit = 5) {
  return useQuery({
    queryKey: ['work-orders', 'upcoming-installs', limit] as const,
    queryFn: () => listWorkOrders(),
    select: (data) =>
      data.items
        .filter((w) => w.type === 'install' && w.status === 'scheduled')
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
        .slice(0, limit),
  })
}

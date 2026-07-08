import { useQuery } from '@tanstack/react-query'

import { listPayments } from '@/api/payments'
import { listWorkOrders } from '@/api/workorders'
import { paymentKeys } from '@/features/payments/queries/keys'
import { workOrderKeys } from '@/features/work-orders/queries/keys'

// Recent payments for the dashboard "Pembayaran terbaru" widget.
export function useRecentPayments(limit = 5) {
  return useQuery({
    queryKey: paymentKeys.recent(limit),
    queryFn: () => listPayments(),
    select: (data) => data.items.slice(0, limit),
  })
}

// Upcoming installs (scheduled install work orders) for the dashboard.
export function useUpcomingInstalls(limit = 5) {
  return useQuery({
    queryKey: workOrderKeys.upcomingInstalls(limit),
    queryFn: () => listWorkOrders(),
    select: (data) =>
      data.items
        .filter((w) => w.type === 'install' && w.status === 'scheduled')
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
        .slice(0, limit),
  })
}

import { useQuery } from '@tanstack/react-query'

import { type WorkOrderFilter, listWorkOrders } from '@/api/workorders'

export function useWorkOrdersList(filter: WorkOrderFilter = {}) {
  return useQuery({
    queryKey: ['work-orders', 'list', filter] as const,
    queryFn: () => listWorkOrders(filter),
  })
}

import { useQuery } from '@tanstack/react-query'

import { type InventoryFilter, listInventory } from '@/api/inventory'

export function useInventoryList(filter: InventoryFilter = {}) {
  return useQuery({
    queryKey: ['inventory', 'list', filter] as const,
    queryFn: () => listInventory(filter),
  })
}

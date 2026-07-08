import type { InventoryFilter, StockMovementFilter } from '@/api/inventory'

const root = ['inventory'] as const

export const inventoryKeys = {
  all: root,
  lists: () => [...root, 'list'] as const,
  list: (filter: InventoryFilter) => [...root, 'list', filter] as const,
  movements: (filter: StockMovementFilter) => [...root, 'movements', filter] as const,
}

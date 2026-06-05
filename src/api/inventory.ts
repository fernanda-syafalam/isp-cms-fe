import { api } from './client'
import { InventoryListSchema, type InventoryList } from '@/schemas/inventory'

export type InventoryFilter = {
  status?: string | undefined
}

export async function listInventory(filter: InventoryFilter = {}): Promise<InventoryList> {
  const searchParams = new URLSearchParams()
  if (filter.status) searchParams.set('status', filter.status)
  const json = await api.get('inventory', { searchParams }).json()
  return InventoryListSchema.parse(json)
}

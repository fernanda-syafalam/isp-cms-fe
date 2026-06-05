import { api } from './client'
import {
  type InventoryItem,
  InventoryItemSchema,
  InventoryListSchema,
  type InventoryList,
  type UpdateInventoryInput,
} from '@/schemas/inventory'

export type InventoryFilter = {
  status?: string | undefined
}

export async function listInventory(filter: InventoryFilter = {}): Promise<InventoryList> {
  const searchParams = new URLSearchParams()
  if (filter.status) searchParams.set('status', filter.status)
  const json = await api.get('inventory', { searchParams }).json()
  return InventoryListSchema.parse(json)
}

export async function updateInventory(
  id: string,
  input: UpdateInventoryInput,
): Promise<InventoryItem> {
  const json = await api.patch(`inventory/${id}`, { json: input }).json()
  return InventoryItemSchema.parse(json)
}

// Hard delete: remove a mis-entered stock item.
export async function deleteInventory(id: string): Promise<void> {
  await api.delete(`inventory/${id}`)
}

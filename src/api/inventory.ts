import { api } from './client'
import {
  type InventoryItem,
  InventoryItemSchema,
  InventoryListSchema,
  type InventoryList,
  type MoveInventoryInput,
  type StockInInput,
  type StockMovementList,
  StockMovementListSchema,
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

// Stock-in: register a new device into the warehouse (logs an "in" movement).
export async function stockInInventory(input: StockInInput): Promise<InventoryItem> {
  const json = await api.post('inventory', { json: input }).json()
  return InventoryItemSchema.parse(json)
}

// Move an item (assign / return / mark broken). Logs a movement + flips status.
export async function moveInventory(id: string, input: MoveInventoryInput): Promise<InventoryItem> {
  const json = await api.post(`inventory/${id}/move`, { json: input }).json()
  return InventoryItemSchema.parse(json)
}

// Full stock movement history (newest first).
export async function listStockMovements(): Promise<StockMovementList> {
  const json = await api.get('inventory/movements').json()
  return StockMovementListSchema.parse(json)
}

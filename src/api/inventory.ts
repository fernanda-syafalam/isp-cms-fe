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
  q?: string | undefined
  status?: string | undefined
  sort?: string | undefined
  order?: 'asc' | 'desc' | undefined
  limit?: number | undefined
  offset?: number | undefined
}

export type StockMovementFilter = {
  q?: string | undefined
  sort?: string | undefined
  order?: 'asc' | 'desc' | undefined
  limit?: number | undefined
  offset?: number | undefined
}

// Backend caps a page at 200 rows; the CSV export pulls a single max-size page
// so it covers the full filtered set without a paging loop.
export const INVENTORY_EXPORT_LIMIT = 200
export const STOCK_MOVEMENT_EXPORT_LIMIT = 200

export async function listInventory(filter: InventoryFilter = {}): Promise<InventoryList> {
  const searchParams = new URLSearchParams()
  if (filter.q) searchParams.set('q', filter.q)
  if (filter.status) searchParams.set('status', filter.status)
  if (filter.sort) searchParams.set('sort', filter.sort)
  if (filter.order) searchParams.set('order', filter.order)
  if (filter.limit !== undefined) searchParams.set('limit', String(filter.limit))
  if (filter.offset !== undefined) searchParams.set('offset', String(filter.offset))
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
export async function listStockMovements(
  filter: StockMovementFilter = {},
): Promise<StockMovementList> {
  const searchParams = new URLSearchParams()
  if (filter.q) searchParams.set('q', filter.q)
  if (filter.sort) searchParams.set('sort', filter.sort)
  if (filter.order) searchParams.set('order', filter.order)
  if (filter.limit !== undefined) searchParams.set('limit', String(filter.limit))
  if (filter.offset !== undefined) searchParams.set('offset', String(filter.offset))
  const json = await api.get('inventory/movements', { searchParams }).json()
  return StockMovementListSchema.parse(json)
}

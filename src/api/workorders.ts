import { api } from './client'
import {
  type WorkOrder,
  WorkOrderListSchema,
  WorkOrderSchema,
  type WorkOrderList,
} from '@/schemas/workorder'

export type WorkOrderFilter = {
  q?: string | undefined
  status?: string | undefined
  type?: string | undefined
  sort?: string | undefined
  order?: 'asc' | 'desc' | undefined
  limit?: number | undefined
  offset?: number | undefined
}

// Backend caps a page at 200 rows; the CSV export pulls a single max-size page
// so it covers the full filtered set without a paging loop.
export const WORKORDER_EXPORT_LIMIT = 200

export async function listWorkOrders(filter: WorkOrderFilter = {}): Promise<WorkOrderList> {
  const searchParams = new URLSearchParams()
  if (filter.q) searchParams.set('q', filter.q)
  if (filter.status) searchParams.set('status', filter.status)
  if (filter.type) searchParams.set('type', filter.type)
  if (filter.sort) searchParams.set('sort', filter.sort)
  if (filter.order) searchParams.set('order', filter.order)
  if (filter.limit !== undefined) searchParams.set('limit', String(filter.limit))
  if (filter.offset !== undefined) searchParams.set('offset', String(filter.offset))
  const json = await api.get('work-orders', { searchParams }).json()
  return WorkOrderListSchema.parse(json)
}

// Complete a work order. For an install WO the backend (mock) also activates the
// customer, provisions the connection, and issues the first invoice.
export async function completeWorkOrder(id: string): Promise<WorkOrder> {
  const json = await api.post(`work-orders/${id}/complete`).json()
  return WorkOrderSchema.parse(json)
}

import { api } from './client'
import {
  type CompleteWorkOrderInput,
  type WorkOrder,
  WorkOrderListSchema,
  WorkOrderSchema,
  type WorkOrderList,
} from '@/schemas/workorder'

export type WorkOrderFilter = {
  q?: string | undefined
  status?: string | undefined
  type?: string | undefined
  // Exact-match technician name — powers the teknisi "Tugas saya" view.
  technician?: string | undefined
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
  if (filter.technician) searchParams.set('technician', filter.technician)
  if (filter.sort) searchParams.set('sort', filter.sort)
  if (filter.order) searchParams.set('order', filter.order)
  if (filter.limit !== undefined) searchParams.set('limit', String(filter.limit))
  if (filter.offset !== undefined) searchParams.set('offset', String(filter.offset))
  const json = await api.get('work-orders', { searchParams }).json()
  return WorkOrderListSchema.parse(json)
}

// Complete a work order. For an install WO the backend (mock) also activates the
// customer, provisions the connection, and issues the first invoice.
export async function completeWorkOrder(
  id: string,
  input?: CompleteWorkOrderInput,
): Promise<WorkOrder> {
  const json = await api.post(`work-orders/${id}/complete`, { json: input ?? {} }).json()
  return WorkOrderSchema.parse(json)
}

// State-machine actions (P3.B.2): start/cancel an open order, (re)assign the
// technician, reschedule. Each returns the updated work order.
export async function startWorkOrder(id: string): Promise<WorkOrder> {
  const json = await api.post(`work-orders/${id}/start`).json()
  return WorkOrderSchema.parse(json)
}

export async function cancelWorkOrder(id: string): Promise<WorkOrder> {
  const json = await api.post(`work-orders/${id}/cancel`).json()
  return WorkOrderSchema.parse(json)
}

export async function assignWorkOrder(id: string, technician: string): Promise<WorkOrder> {
  const json = await api.post(`work-orders/${id}/assign`, { json: { technician } }).json()
  return WorkOrderSchema.parse(json)
}

export async function rescheduleWorkOrder(id: string, scheduledAt: string): Promise<WorkOrder> {
  const json = await api.post(`work-orders/${id}/reschedule`, { json: { scheduledAt } }).json()
  return WorkOrderSchema.parse(json)
}

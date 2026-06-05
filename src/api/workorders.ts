import { api } from './client'
import {
  type WorkOrder,
  WorkOrderListSchema,
  WorkOrderSchema,
  type WorkOrderList,
} from '@/schemas/workorder'

export type WorkOrderFilter = {
  status?: string | undefined
}

export async function listWorkOrders(filter: WorkOrderFilter = {}): Promise<WorkOrderList> {
  const searchParams = new URLSearchParams()
  if (filter.status) searchParams.set('status', filter.status)
  const json = await api.get('work-orders', { searchParams }).json()
  return WorkOrderListSchema.parse(json)
}

// Complete a work order. For an install WO the backend (mock) also activates the
// customer, provisions the connection, and issues the first invoice.
export async function completeWorkOrder(id: string): Promise<WorkOrder> {
  const json = await api.post(`work-orders/${id}/complete`).json()
  return WorkOrderSchema.parse(json)
}

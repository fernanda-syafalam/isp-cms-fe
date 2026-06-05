import { api } from './client'
import { WorkOrderListSchema, type WorkOrderList } from '@/schemas/workorder'

export type WorkOrderFilter = {
  status?: string | undefined
}

export async function listWorkOrders(filter: WorkOrderFilter = {}): Promise<WorkOrderList> {
  const searchParams = new URLSearchParams()
  if (filter.status) searchParams.set('status', filter.status)
  const json = await api.get('work-orders', { searchParams }).json()
  return WorkOrderListSchema.parse(json)
}

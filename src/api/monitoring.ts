import { api } from './client'
import {
  type AlertList,
  AlertListSchema,
  type DeviceMetricList,
  DeviceMetricListSchema,
} from '@/schemas/monitoring'

// Device-metrics list query. Mirrors the backend list contract: `q` searches
// device name/area, `sort`/`order` a whitelisted column, `limit`/`offset` page.
export type DeviceMetricFilter = {
  status?: string | undefined
  q?: string | undefined
  sort?: string | undefined
  order?: 'asc' | 'desc' | undefined
  limit?: number | undefined
  offset?: number | undefined
}

export async function listDeviceMetrics(
  filter: DeviceMetricFilter = {},
): Promise<DeviceMetricList> {
  const searchParams = new URLSearchParams()
  if (filter.status) searchParams.set('status', filter.status)
  if (filter.q) searchParams.set('q', filter.q)
  if (filter.sort) searchParams.set('sort', filter.sort)
  if (filter.order) searchParams.set('order', filter.order)
  if (filter.limit !== undefined) searchParams.set('limit', String(filter.limit))
  if (filter.offset !== undefined) searchParams.set('offset', String(filter.offset))
  const json = await api.get('monitoring/metrics', { searchParams }).json()
  return DeviceMetricListSchema.parse(json)
}

export async function listAlerts(): Promise<AlertList> {
  const json = await api.get('monitoring/alerts').json()
  return AlertListSchema.parse(json)
}

export async function acknowledgeAlert(id: string): Promise<void> {
  await api.post(`monitoring/alerts/${id}/acknowledge`)
}

// Escalate an alert into a support ticket (auto-ticket) + acknowledge it.
export async function createTicketFromAlert(id: string): Promise<void> {
  await api.post(`monitoring/alerts/${id}/ticket`)
}

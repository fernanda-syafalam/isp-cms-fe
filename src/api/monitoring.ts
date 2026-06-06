import { api } from './client'
import {
  type AlertList,
  AlertListSchema,
  type DeviceMetricList,
  DeviceMetricListSchema,
} from '@/schemas/monitoring'

export async function listDeviceMetrics(): Promise<DeviceMetricList> {
  const json = await api.get('monitoring/metrics').json()
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

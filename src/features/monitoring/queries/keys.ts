import type { DeviceMetricFilter } from '@/api/monitoring'

const root = ['monitoring'] as const

export const monitoringKeys = {
  all: root,
  metrics: (filter: DeviceMetricFilter) => [...root, 'metrics', filter] as const,
  alerts: () => [...root, 'alerts'] as const,
}

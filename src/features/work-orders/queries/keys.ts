import type { WorkOrderFilter } from '@/api/workorders'

const root = ['work-orders'] as const

export const workOrderKeys = {
  all: root,
  lists: () => [...root, 'list'] as const,
  list: (filter: WorkOrderFilter) => [...root, 'list', filter] as const,
  upcomingInstalls: (limit: number) => [...root, 'upcoming-installs', limit] as const,
}

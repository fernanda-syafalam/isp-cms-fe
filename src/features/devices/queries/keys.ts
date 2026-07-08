import type { DeviceFilter } from '@/api/devices'

const root = ['devices'] as const

export const deviceKeys = {
  all: root,
  lists: () => [...root, 'list'] as const,
  list: (filter: DeviceFilter) => [...root, 'list', filter] as const,
  details: () => [...root, 'detail'] as const,
  detail: (id: string) => [...root, 'detail', id] as const,
}

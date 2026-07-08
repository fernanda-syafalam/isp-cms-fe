import type { OdpFilter } from '@/api/odp'

const root = ['odp'] as const

export const odpKeys = {
  all: root,
  lists: () => [...root, 'list'] as const,
  list: (filter: OdpFilter) => [...root, 'list', filter] as const,
}

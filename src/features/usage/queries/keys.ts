import type { UsageFilter } from '@/api/usage'

const root = ['usage'] as const

export const usageKeys = {
  all: root,
  lists: () => [...root, 'list'] as const,
  list: (filter: UsageFilter) => [...root, 'list', filter] as const,
}

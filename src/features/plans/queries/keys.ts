import type { PlanFilter } from '@/api/plans'

const root = ['plans'] as const

export const planKeys = {
  all: root,
  lists: () => [...root, 'list'] as const,
  list: (filter: PlanFilter) => [...root, 'list', filter] as const,
}

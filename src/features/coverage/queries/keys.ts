import type { CoverageFilter } from '@/api/coverage'

const root = ['coverage'] as const

export const coverageKeys = {
  all: root,
  lists: () => [...root, 'list'] as const,
  list: (filter: CoverageFilter) => [...root, 'list', filter] as const,
}

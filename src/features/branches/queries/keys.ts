import type { BranchFilter } from '@/api/branches'

const root = ['branches'] as const

export const branchKeys = {
  all: root,
  lists: () => [...root, 'list'] as const,
  list: (filter: BranchFilter) => [...root, 'list', filter] as const,
}

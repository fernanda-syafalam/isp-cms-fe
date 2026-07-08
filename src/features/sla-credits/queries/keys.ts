import type { SlaCreditFilter } from '@/api/slaCredits'

const root = ['sla-credits'] as const

export const slaCreditKeys = {
  all: root,
  lists: () => [...root, 'list'] as const,
  list: (filter: SlaCreditFilter) => [...root, 'list', filter] as const,
}

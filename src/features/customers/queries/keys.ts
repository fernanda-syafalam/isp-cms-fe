import type { CustomerFilter } from '@/api/customers'

const root = ['customers'] as const

export const customerKeys = {
  all: root,
  lists: () => [...root, 'list'] as const,
  list: (filter: CustomerFilter) => [...root, 'list', filter] as const,
  details: () => [...root, 'detail'] as const,
  detail: (id: string) => [...root, 'detail', id] as const,
  composition: () => [...root, 'composition'] as const,
}

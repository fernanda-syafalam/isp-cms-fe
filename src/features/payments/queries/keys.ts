import type { PaymentFilter } from '@/api/payments'

const root = ['payments'] as const

export const paymentKeys = {
  all: root,
  lists: () => [...root, 'list'] as const,
  list: (filter: PaymentFilter) => [...root, 'list', filter] as const,
  reconciliation: (date: string) => [...root, 'reconciliation', date] as const,
  recent: (limit: number) => [...root, 'recent', limit] as const,
}

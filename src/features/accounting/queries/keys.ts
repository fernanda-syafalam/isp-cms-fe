import type { JournalFilter } from '@/api/accounting'

const root = ['accounting'] as const

export const accountingKeys = {
  all: root,
  journal: (period: string, filter: JournalFilter) => [...root, 'journal', period, filter] as const,
}

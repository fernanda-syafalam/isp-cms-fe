import type { LedgerFilter, ResellerFilter } from '@/api/resellers'

const root = ['resellers'] as const

export const resellerKeys = {
  all: root,
  lists: () => [...root, 'list'] as const,
  list: (filter: ResellerFilter) => [...root, 'list', filter] as const,
  details: () => [...root, 'detail'] as const,
  detail: (id: string) => [...root, 'detail', id] as const,
  ledgerBase: (id: string) => [...root, 'detail', id, 'ledger'] as const,
  ledger: (id: string, filter: LedgerFilter) => [...root, 'detail', id, 'ledger', filter] as const,
  payouts: (id: string) => [...root, 'detail', id, 'payouts'] as const,
  commissionTotal: (id: string) => [...root, 'detail', id, 'commission-total'] as const,
}

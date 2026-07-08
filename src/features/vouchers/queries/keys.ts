import type { VoucherFilter } from '@/api/vouchers'

const root = ['vouchers'] as const

export const voucherKeys = {
  all: root,
  lists: () => [...root, 'list'] as const,
  list: (filter: VoucherFilter) => [...root, 'list', filter] as const,
}

import { createFileRoute } from '@tanstack/react-router'

import { VouchersListPage } from '@/features/vouchers'
import { statusSearch } from '@/lib/search'

export const Route = createFileRoute('/_auth/vouchers')({
  component: VouchersListPage,
  validateSearch: statusSearch,
})

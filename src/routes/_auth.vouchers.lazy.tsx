import { createLazyFileRoute } from '@tanstack/react-router'

import { VouchersListPage } from '@/features/vouchers'

export const Route = createLazyFileRoute('/_auth/vouchers')({
  component: VouchersListPage,
})

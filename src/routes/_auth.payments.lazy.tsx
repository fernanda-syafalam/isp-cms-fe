import { createLazyFileRoute } from '@tanstack/react-router'

import { PaymentsListPage } from '@/features/payments'

export const Route = createLazyFileRoute('/_auth/payments')({
  component: PaymentsListPage,
})

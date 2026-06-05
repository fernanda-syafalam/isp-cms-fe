import { createFileRoute } from '@tanstack/react-router'

import { PaymentsListPage } from '@/features/payments'

export const Route = createFileRoute('/_auth/payments')({
  component: PaymentsListPage,
})

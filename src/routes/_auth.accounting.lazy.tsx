import { createLazyFileRoute } from '@tanstack/react-router'

import { AccountingPage } from '@/features/accounting'

export const Route = createLazyFileRoute('/_auth/accounting')({
  component: AccountingPage,
})

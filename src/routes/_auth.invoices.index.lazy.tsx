import { createLazyFileRoute } from '@tanstack/react-router'

import { InvoicesListPage } from '@/features/invoices'

export const Route = createLazyFileRoute('/_auth/invoices/')({
  component: InvoicesListPage,
})

import { createFileRoute } from '@tanstack/react-router'

import { InvoicesListPage } from '@/features/invoices'

export const Route = createFileRoute('/_auth/invoices/')({
  component: InvoicesListPage,
})

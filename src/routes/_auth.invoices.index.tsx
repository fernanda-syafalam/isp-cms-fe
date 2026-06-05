import { createFileRoute } from '@tanstack/react-router'

import { InvoicesListPage } from '@/features/invoices'
import { statusSearch } from '@/lib/search'

export const Route = createFileRoute('/_auth/invoices/')({
  component: InvoicesListPage,
  validateSearch: statusSearch,
})

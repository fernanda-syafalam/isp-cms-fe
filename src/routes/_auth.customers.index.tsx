import { createFileRoute } from '@tanstack/react-router'

import { CustomersListPage } from '@/features/customers'
import { statusSearch } from '@/lib/search'

export const Route = createFileRoute('/_auth/customers/')({
  component: CustomersListPage,
  validateSearch: statusSearch,
})

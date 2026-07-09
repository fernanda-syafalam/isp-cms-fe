import { createLazyFileRoute } from '@tanstack/react-router'

import { CustomersListPage } from '@/features/customers'

export const Route = createLazyFileRoute('/_auth/customers/')({
  component: CustomersListPage,
})

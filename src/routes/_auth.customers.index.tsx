import { createFileRoute } from '@tanstack/react-router'

import { CustomersListPage } from '@/features/customers'

export const Route = createFileRoute('/_auth/customers/')({
  component: CustomersListPage,
})

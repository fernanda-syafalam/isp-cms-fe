import { createFileRoute } from '@tanstack/react-router'

import { CustomerDetailPage } from '@/features/customers'

export const Route = createFileRoute('/_auth/customers/$customerId')({
  component: CustomerDetailRoute,
})

function CustomerDetailRoute() {
  const { customerId } = Route.useParams()
  return <CustomerDetailPage customerId={customerId} />
}

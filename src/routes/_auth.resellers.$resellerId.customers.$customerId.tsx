import { createFileRoute } from '@tanstack/react-router'

import { ResellerCustomerDetailPage } from '@/features/resellers'

export const Route = createFileRoute('/_auth/resellers/$resellerId/customers/$customerId')({
  component: ResellerCustomerDetailRoute,
})

function ResellerCustomerDetailRoute() {
  const { resellerId, customerId } = Route.useParams()
  return <ResellerCustomerDetailPage resellerId={resellerId} customerId={customerId} />
}

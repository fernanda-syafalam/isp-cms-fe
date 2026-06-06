import { createFileRoute } from '@tanstack/react-router'

import { ResellerDetailPage } from '@/features/resellers'

export const Route = createFileRoute('/_auth/resellers/$resellerId')({
  component: ResellerDetailRoute,
})

function ResellerDetailRoute() {
  const { resellerId } = Route.useParams()
  return <ResellerDetailPage resellerId={resellerId} />
}

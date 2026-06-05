import { createFileRoute } from '@tanstack/react-router'

import { RouterDetailPage } from '@/features/routers'

export const Route = createFileRoute('/_auth/network/routers/$routerId')({
  component: RouterDetailRoute,
})

function RouterDetailRoute() {
  const { routerId } = Route.useParams()
  return <RouterDetailPage routerId={routerId} />
}

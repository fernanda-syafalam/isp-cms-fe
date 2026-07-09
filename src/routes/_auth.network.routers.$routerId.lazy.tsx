import { createLazyFileRoute } from '@tanstack/react-router'

import { RouterDetailPage } from '@/features/routers'

export const Route = createLazyFileRoute('/_auth/network/routers/$routerId')({
  component: RouterDetailRoute,
})

function RouterDetailRoute() {
  const { routerId } = Route.useParams()
  return <RouterDetailPage routerId={routerId} />
}

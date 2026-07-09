import { createLazyFileRoute } from '@tanstack/react-router'

import { DeviceDetailPage } from '@/features/devices'

export const Route = createLazyFileRoute('/_auth/network/devices/$deviceId')({
  component: DeviceDetailRoute,
})

function DeviceDetailRoute() {
  const { deviceId } = Route.useParams()
  return <DeviceDetailPage deviceId={deviceId} />
}

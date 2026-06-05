import { createFileRoute } from '@tanstack/react-router'

import { DeviceDetailPage } from '@/features/devices'

export const Route = createFileRoute('/_auth/network/devices/$deviceId')({
  component: DeviceDetailRoute,
})

function DeviceDetailRoute() {
  const { deviceId } = Route.useParams()
  return <DeviceDetailPage deviceId={deviceId} />
}

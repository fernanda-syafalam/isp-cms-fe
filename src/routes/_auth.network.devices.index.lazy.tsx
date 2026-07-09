import { createLazyFileRoute } from '@tanstack/react-router'

import { DevicesListPage } from '@/features/devices'

export const Route = createLazyFileRoute('/_auth/network/devices/')({
  component: DevicesListPage,
})

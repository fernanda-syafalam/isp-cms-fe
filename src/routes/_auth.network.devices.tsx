import { createFileRoute } from '@tanstack/react-router'

import { DevicesListPage } from '@/features/devices'

export const Route = createFileRoute('/_auth/network/devices')({
  component: DevicesListPage,
})

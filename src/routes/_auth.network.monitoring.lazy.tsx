import { createLazyFileRoute } from '@tanstack/react-router'

import { MonitoringPage } from '@/features/monitoring'

export const Route = createLazyFileRoute('/_auth/network/monitoring')({
  component: MonitoringPage,
})

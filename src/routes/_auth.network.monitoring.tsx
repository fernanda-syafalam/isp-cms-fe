import { createFileRoute } from '@tanstack/react-router'

import { MonitoringPage } from '@/features/monitoring'

export const Route = createFileRoute('/_auth/network/monitoring')({
  component: MonitoringPage,
})

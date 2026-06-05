import { createLazyFileRoute } from '@tanstack/react-router'

import { DashboardPage } from '@/features/dashboard'

export const Route = createLazyFileRoute('/_auth/')({
  component: DashboardPage,
})

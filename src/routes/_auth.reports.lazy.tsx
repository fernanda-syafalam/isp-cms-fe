import { createLazyFileRoute } from '@tanstack/react-router'

import { ReportsPage } from '@/features/reports'

export const Route = createLazyFileRoute('/_auth/reports')({
  component: ReportsPage,
})

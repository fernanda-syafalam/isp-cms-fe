import { createFileRoute } from '@tanstack/react-router'

import { PlansListPage } from '@/features/plans'

export const Route = createFileRoute('/_auth/plans')({
  component: PlansListPage,
})

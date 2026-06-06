import { createLazyFileRoute } from '@tanstack/react-router'

import { PlansListPage } from '@/features/plans'

export const Route = createLazyFileRoute('/_auth/plans')({
  component: PlansListPage,
})

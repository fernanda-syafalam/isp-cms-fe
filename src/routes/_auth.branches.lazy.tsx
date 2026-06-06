import { createLazyFileRoute } from '@tanstack/react-router'

import { BranchesPage } from '@/features/branches'

export const Route = createLazyFileRoute('/_auth/branches')({
  component: BranchesPage,
})

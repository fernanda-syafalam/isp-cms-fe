import { createLazyFileRoute } from '@tanstack/react-router'

import { CoverageListPage } from '@/features/coverage'

export const Route = createLazyFileRoute('/_auth/coverage')({
  component: CoverageListPage,
})

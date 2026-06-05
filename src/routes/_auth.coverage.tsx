import { createFileRoute } from '@tanstack/react-router'

import { CoverageListPage } from '@/features/coverage'

export const Route = createFileRoute('/_auth/coverage')({
  component: CoverageListPage,
})

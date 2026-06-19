import { createFileRoute } from '@tanstack/react-router'

import { ResellersListPage } from '@/features/resellers'
import { statusSearch } from '@/lib/search'

export const Route = createFileRoute('/_auth/resellers/')({
  component: ResellersListPage,
  validateSearch: statusSearch,
})

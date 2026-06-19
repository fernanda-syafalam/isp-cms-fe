import { createFileRoute } from '@tanstack/react-router'

import { RoutersListPage } from '@/features/routers'
import { statusSearch } from '@/lib/search'

export const Route = createFileRoute('/_auth/network/routers/')({
  component: RoutersListPage,
  validateSearch: statusSearch,
})

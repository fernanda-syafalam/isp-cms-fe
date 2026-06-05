import { createFileRoute } from '@tanstack/react-router'

import { TicketsListPage } from '@/features/tickets'
import { statusSearch } from '@/lib/search'

export const Route = createFileRoute('/_auth/tickets')({
  component: TicketsListPage,
  validateSearch: statusSearch,
})

import { createLazyFileRoute } from '@tanstack/react-router'

import { TicketsListPage } from '@/features/tickets'

export const Route = createLazyFileRoute('/_auth/tickets/')({
  component: TicketsListPage,
})

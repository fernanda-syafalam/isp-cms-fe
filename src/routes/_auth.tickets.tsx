import { createFileRoute } from '@tanstack/react-router'

import { TicketsListPage } from '@/features/tickets'

export const Route = createFileRoute('/_auth/tickets')({
  component: TicketsListPage,
})

import { createLazyFileRoute } from '@tanstack/react-router'

import { TicketDetailPage } from '@/features/tickets'

export const Route = createLazyFileRoute('/_auth/tickets/$ticketId')({
  component: TicketDetailRoute,
})

function TicketDetailRoute() {
  const { ticketId } = Route.useParams()
  return <TicketDetailPage ticketId={ticketId} />
}

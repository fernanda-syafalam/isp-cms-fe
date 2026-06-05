import { createFileRoute } from '@tanstack/react-router'

import { statusSearch } from '@/lib/search'

// Layout route (renders <Outlet/>) so the list (index) and detail ($ticketId)
// are siblings; status filter is validated here and inherited by children.
export const Route = createFileRoute('/_auth/tickets')({
  validateSearch: statusSearch,
})

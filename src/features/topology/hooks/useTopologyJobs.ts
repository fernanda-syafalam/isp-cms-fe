import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { listTickets } from '@/api/tickets'
import { listWorkOrders } from '@/api/workorders'

export type TopologyJobs = {
  /** customerIds with any open work order or ticket. */
  jobCustomerIds: Set<string>
  /** ...of those, the ones assigned to the current technician. */
  myJobCustomerIds: Set<string>
  openCount: number
  myCount: number
}

// A work order is "open" until it's done/cancelled; a ticket until it's
// resolved. Both link to a subscriber via customerId, which the topology
// customer nodes also carry (meta.customerId) — that's the join.
function isOpenWorkOrder(status: string): boolean {
  return status === 'scheduled' || status === 'in_progress'
}
function isOpenTicket(status: string): boolean {
  return status !== 'resolved'
}

// Indexes open work orders + tickets by customerId so the topology map can badge
// customers with active jobs and highlight the current technician's own. Reads
// the shared work-order/ticket endpoints (hooks → api); `myName` is passed in by
// the page (from useCurrentUser) to avoid importing the auth feature here. The
// result is memoized so the (memoized) map markers don't rebuild every render.
export function useTopologyJobs(myName: string | null): TopologyJobs {
  const workOrders = useQuery({
    queryKey: ['workorders', 'list', {}] as const,
    queryFn: () => listWorkOrders(),
  })
  const tickets = useQuery({
    queryKey: ['tickets', 'list', {}] as const,
    queryFn: () => listTickets(),
  })

  const woItems = workOrders.data?.items
  const tkItems = tickets.data?.items

  return useMemo(() => {
    const jobCustomerIds = new Set<string>()
    const myJobCustomerIds = new Set<string>()
    for (const w of woItems ?? []) {
      if (!w.customerId || !isOpenWorkOrder(w.status)) continue
      jobCustomerIds.add(w.customerId)
      if (myName && w.technician === myName) myJobCustomerIds.add(w.customerId)
    }
    for (const t of tkItems ?? []) {
      if (!t.customerId || !isOpenTicket(t.status)) continue
      jobCustomerIds.add(t.customerId)
      if (myName && t.assignee === myName) myJobCustomerIds.add(t.customerId)
    }
    return {
      jobCustomerIds,
      myJobCustomerIds,
      openCount: jobCustomerIds.size,
      myCount: myJobCustomerIds.size,
    }
  }, [woItems, tkItems, myName])
}

import { useQuery } from '@tanstack/react-query'

import { listCustomers } from '@/api/customers'
import { customerKeys } from '@/features/customers/queries/keys'
import { statusLabel } from '@/lib/status-label'

const ORDER = ['prospek', 'instalasi', 'aktif', 'isolir', 'berhenti'] as const

// Lifecycle composition derived from the customers list (mock-first). The real
// backend will expose an aggregate endpoint later.
export function useCustomerComposition() {
  return useQuery({
    queryKey: customerKeys.composition(),
    queryFn: () => listCustomers(),
    select: (data) => {
      const counts = new Map<string, number>()
      for (const c of data.items) counts.set(c.status, (counts.get(c.status) ?? 0) + 1)
      return ORDER.map((status) => ({
        label: statusLabel(status),
        count: counts.get(status) ?? 0,
      }))
    },
  })
}

import { useQuery } from '@tanstack/react-query'

import { listAudit } from '@/api/audit'

// Audit entries scoped to one topology node (create/move/re-home/install/delete).
// Shares the `['audit']` cache root, so topology mutations that invalidate audit
// also refresh this. Disabled until a node is selected.
export function useNodeHistory(entityId: string | null) {
  return useQuery({
    queryKey: ['audit', 'list', { entityId }] as const,
    queryFn: () => listAudit(entityId ? { entityId } : {}),
    enabled: entityId !== null,
  })
}

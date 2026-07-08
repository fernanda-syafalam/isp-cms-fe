import { useQuery } from '@tanstack/react-query'

import { listAudit } from '@/api/audit'
import { auditKeys } from '@/features/audit/queries/keys'

// Audit entries scoped to one topology node (create/move/re-home/install/delete).
// Shares the `['audit']` cache root, so topology mutations that invalidate audit
// also refresh this. Disabled until a node is selected.
export function useNodeHistory(entityId: string | null) {
  return useQuery({
    queryKey: auditKeys.list(entityId ? { entityId } : {}),
    queryFn: () => listAudit(entityId ? { entityId } : {}),
    enabled: entityId !== null,
  })
}

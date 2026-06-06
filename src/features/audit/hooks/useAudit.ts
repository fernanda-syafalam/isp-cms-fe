import { useQuery } from '@tanstack/react-query'

import { listAudit } from '@/api/audit'

export function useAuditLog() {
  return useQuery({
    queryKey: ['audit'] as const,
    queryFn: listAudit,
  })
}

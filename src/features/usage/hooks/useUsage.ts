import { useQuery } from '@tanstack/react-query'

import { listUsage } from '@/api/usage'

export function useUsageList() {
  return useQuery({
    queryKey: ['usage', 'list'] as const,
    queryFn: listUsage,
  })
}

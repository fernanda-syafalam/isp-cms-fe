import { useQuery } from '@tanstack/react-query'

import { listTopology } from '@/api/topology'

export function useTopology() {
  return useQuery({
    queryKey: ['topology', 'list'] as const,
    queryFn: listTopology,
  })
}

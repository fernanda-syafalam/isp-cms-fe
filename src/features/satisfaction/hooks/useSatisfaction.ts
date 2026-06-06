import { useQuery } from '@tanstack/react-query'

import { getSatisfaction } from '@/api/satisfaction'

export function useSatisfaction() {
  return useQuery({
    queryKey: ['satisfaction'] as const,
    queryFn: getSatisfaction,
  })
}

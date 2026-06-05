import { useQuery } from '@tanstack/react-query'

import { listCoverage } from '@/api/coverage'

export function useCoverageList() {
  return useQuery({
    queryKey: ['coverage', 'list'] as const,
    queryFn: listCoverage,
  })
}

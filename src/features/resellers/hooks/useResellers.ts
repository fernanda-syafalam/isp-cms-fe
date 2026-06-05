import { useQuery } from '@tanstack/react-query'

import { listResellers } from '@/api/resellers'

export function useResellersList() {
  return useQuery({
    queryKey: ['resellers', 'list'] as const,
    queryFn: listResellers,
  })
}

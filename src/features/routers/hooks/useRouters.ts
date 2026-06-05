import { useQuery } from '@tanstack/react-query'

import { listRouters } from '@/api/routers'

export function useRoutersList() {
  return useQuery({
    queryKey: ['routers', 'list'] as const,
    queryFn: listRouters,
  })
}

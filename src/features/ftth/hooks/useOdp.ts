import { useQuery } from '@tanstack/react-query'

import { listOdp } from '@/api/odp'

export function useOdpList() {
  return useQuery({
    queryKey: ['odp', 'list'] as const,
    queryFn: listOdp,
  })
}

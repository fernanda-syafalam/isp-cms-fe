import { useQuery } from '@tanstack/react-query'

import { getSatisfaction } from '@/api/satisfaction'
import { satisfactionKeys } from '../queries/keys'

export function useSatisfaction() {
  return useQuery({
    queryKey: satisfactionKeys.all,
    queryFn: getSatisfaction,
  })
}

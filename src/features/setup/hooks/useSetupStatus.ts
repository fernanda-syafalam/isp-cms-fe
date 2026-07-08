import { useQuery } from '@tanstack/react-query'

import { getSetupStatus } from '@/api/setup'
import { setupKeys } from '@/features/setup/queries/keys'

export function useSetupStatus() {
  return useQuery({
    queryKey: setupKeys.status(),
    queryFn: getSetupStatus,
  })
}

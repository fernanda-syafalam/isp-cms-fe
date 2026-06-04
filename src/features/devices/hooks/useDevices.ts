import { useQuery } from '@tanstack/react-query'

import { listDevices } from '@/api/devices'

export function useDevicesList() {
  return useQuery({
    queryKey: ['devices', 'list'] as const,
    queryFn: listDevices,
  })
}

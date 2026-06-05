import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getDevice, listDevices, rebootDevice } from '@/api/devices'
import { getErrorMessage } from '@/lib/errors'

export function useDevicesList() {
  return useQuery({
    queryKey: ['devices', 'list'] as const,
    queryFn: listDevices,
  })
}

export function useDevice(id: string) {
  return useQuery({
    queryKey: ['devices', 'detail', id] as const,
    queryFn: () => getDevice(id),
  })
}

export function useRebootDevice(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => rebootDevice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devices'] })
      toast.success('Perintah reboot dikirim')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

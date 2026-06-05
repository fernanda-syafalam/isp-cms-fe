import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { deleteDevice, getDevice, listDevices, rebootDevice, updateDevice } from '@/api/devices'
import { getErrorMessage } from '@/lib/errors'
import type { UpdateDeviceInput } from '@/schemas/device'

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

export function useUpdateDevice(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateDeviceInput) => updateDevice(id, input),
    onSuccess: (device) => {
      qc.invalidateQueries({ queryKey: ['devices'] })
      toast.success(`Perangkat "${device.name}" diperbarui`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteDevice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDevice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devices'] })
      toast.success('Perangkat dihapus')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

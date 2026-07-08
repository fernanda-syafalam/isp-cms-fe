import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  type DeviceFilter,
  DEVICE_EXPORT_LIMIT,
  deleteDevice,
  getDevice,
  listDevices,
  rebootDevice,
  updateDevice,
} from '@/api/devices'
import { deviceKeys } from '@/features/devices/queries/keys'
import { getErrorMessage } from '@/lib/errors'
import type { UpdateDeviceInput } from '@/schemas/device'

export function useDevicesList(filter: DeviceFilter = {}) {
  return useQuery({
    queryKey: deviceKeys.list(filter),
    queryFn: () => listDevices(filter),
  })
}

/**
 * Returns a callback that fetches the full filtered device set (one max-size
 * page) for CSV export. With server pagination the table holds only the current
 * page, so export must re-query without the page window.
 */
export function useExportDevices() {
  const qc = useQueryClient()
  return (filter: DeviceFilter = {}) => {
    const exportFilter: DeviceFilter = {
      ...filter,
      limit: DEVICE_EXPORT_LIMIT,
      offset: 0,
    }
    return qc.fetchQuery({
      queryKey: deviceKeys.list(exportFilter),
      queryFn: () => listDevices(exportFilter),
    })
  }
}

export function useDevice(id: string) {
  return useQuery({
    queryKey: deviceKeys.detail(id),
    queryFn: () => getDevice(id),
  })
}

export function useRebootDevice(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => rebootDevice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: deviceKeys.all })
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
      qc.invalidateQueries({ queryKey: deviceKeys.all })
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
      qc.invalidateQueries({ queryKey: deviceKeys.all })
      toast.success('Perangkat dihapus')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

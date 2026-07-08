import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { type AcsDeviceFilter, bulkAcs, listAcsDevices } from '@/api/acs'
import { acsKeys } from '@/features/acs/queries/keys'
import { getErrorMessage } from '@/lib/errors'
import type { BulkAcsInput } from '@/schemas/acs'

export function useAcsDevices(filter: AcsDeviceFilter = {}) {
  return useQuery({
    queryKey: acsKeys.devices(filter),
    queryFn: () => listAcsDevices(filter),
  })
}

const ACTION_LABEL: Record<BulkAcsInput['action'], string> = {
  reboot: 'Reboot',
  firmware: 'Push firmware',
  wifi: 'Set WiFi',
}

export function useBulkAcs() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: BulkAcsInput) => bulkAcs(input),
    onSuccess: (res, vars) => {
      qc.invalidateQueries({ queryKey: acsKeys.devicesBase() })
      toast.success(`${ACTION_LABEL[vars.action]}: ${res.affected} perangkat`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

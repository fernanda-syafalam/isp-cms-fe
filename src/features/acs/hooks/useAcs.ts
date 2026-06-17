import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { type AcsDeviceFilter, bulkAcs, listAcsDevices } from '@/api/acs'
import { getErrorMessage } from '@/lib/errors'
import type { BulkAcsInput } from '@/schemas/acs'

export function useAcsDevices(filter: AcsDeviceFilter = {}) {
  return useQuery({
    queryKey: ['acs', 'devices', filter] as const,
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
      qc.invalidateQueries({ queryKey: ['acs', 'devices'] })
      toast.success(`${ACTION_LABEL[vars.action]}: ${res.affected} perangkat`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

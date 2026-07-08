import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getPublicSettings, getSettings, updateSettings } from '@/api/settings'
import { auditKeys } from '@/features/audit/queries/keys'
import { settingsKeys } from '@/features/settings/queries/keys'
import { getErrorMessage } from '@/lib/errors'
import type { UpdateSettingsInput } from '@/schemas/settings'

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: getSettings,
    staleTime: 5 * 60_000,
  })
}

// Invoice-render subset — usable by staff/customer roles that may not read the
// full admin-only settings blob (`GET /v1/settings` is admin-scoped).
export function usePublicSettings() {
  return useQuery({
    queryKey: settingsKeys.public(),
    queryFn: getPublicSettings,
    staleTime: 5 * 60_000,
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateSettingsInput) => updateSettings(input),
    onSuccess: (settings) => {
      qc.setQueryData(settingsKeys.all, settings)
      qc.invalidateQueries({ queryKey: auditKeys.all })
      toast.success('Pengaturan disimpan')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

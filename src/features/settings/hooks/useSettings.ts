import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getSettings, updateSettings } from '@/api/settings'
import { getErrorMessage } from '@/lib/errors'
import type { UpdateSettingsInput } from '@/schemas/settings'

export function useSettings() {
  return useQuery({
    queryKey: ['settings'] as const,
    queryFn: getSettings,
    staleTime: 5 * 60_000,
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateSettingsInput) => updateSettings(input),
    onSuccess: (settings) => {
      qc.setQueryData(['settings'], settings)
      qc.invalidateQueries({ queryKey: ['audit'] })
      toast.success('Pengaturan disimpan')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

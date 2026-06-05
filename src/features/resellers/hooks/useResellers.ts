import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { listResellers, updateReseller } from '@/api/resellers'
import { getErrorMessage } from '@/lib/errors'
import type { UpdateResellerInput } from '@/schemas/reseller'

export function useResellersList() {
  return useQuery({
    queryKey: ['resellers', 'list'] as const,
    queryFn: listResellers,
  })
}

export function useUpdateReseller(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateResellerInput) => updateReseller(id, input),
    onSuccess: (reseller) => {
      qc.invalidateQueries({ queryKey: ['resellers'] })
      toast.success(
        reseller.status === 'inactive'
          ? `Reseller "${reseller.name}" dinonaktifkan`
          : `Reseller "${reseller.name}" diperbarui`,
      )
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

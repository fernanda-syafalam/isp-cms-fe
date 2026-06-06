import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { applySlaCredit, createSlaCredit, listSlaCredits, voidSlaCredit } from '@/api/slaCredits'
import { getErrorMessage } from '@/lib/errors'
import type { CreateSlaCreditInput } from '@/schemas/slaCredit'

export function useSlaCredits() {
  return useQuery({
    queryKey: ['sla-credits', 'list'] as const,
    queryFn: listSlaCredits,
  })
}

export function useCreateSlaCredit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSlaCreditInput) => createSlaCredit(input),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['sla-credits'] })
      toast.success(`Kredit SLA untuk "${c.customerName}" diterbitkan`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useApplySlaCredit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => applySlaCredit(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sla-credits'] })
      toast.success('Kredit diterapkan ke tagihan berikutnya')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useVoidSlaCredit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => voidSlaCredit(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sla-credits'] })
      toast.success('Kredit dibatalkan')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

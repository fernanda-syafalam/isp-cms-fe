import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  type SlaCreditFilter,
  applySlaCredit,
  createSlaCredit,
  listSlaCredits,
  voidSlaCredit,
} from '@/api/slaCredits'
import { getErrorMessage } from '@/lib/errors'
import type { CreateSlaCreditInput } from '@/schemas/slaCredit'
import { slaCreditKeys } from '../queries/keys'

export function useSlaCredits(filter: SlaCreditFilter = {}) {
  return useQuery({
    queryKey: slaCreditKeys.list(filter),
    queryFn: () => listSlaCredits(filter),
  })
}

export function useCreateSlaCredit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSlaCreditInput) => createSlaCredit(input),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: slaCreditKeys.all })
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
      qc.invalidateQueries({ queryKey: slaCreditKeys.all })
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
      qc.invalidateQueries({ queryKey: slaCreditKeys.all })
      toast.success('Kredit dibatalkan')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

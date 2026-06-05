import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { archivePlan, createPlan, listPlans, updatePlan } from '@/api/plans'
import { getErrorMessage } from '@/lib/errors'
import type { CreatePlanInput } from '@/schemas/plan'

export function usePlansList() {
  return useQuery({
    queryKey: ['plans', 'list'] as const,
    queryFn: listPlans,
  })
}

export function useCreatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePlanInput) => createPlan(input),
    onSuccess: (plan) => {
      qc.invalidateQueries({ queryKey: ['plans'] })
      toast.success(`Paket "${plan.name}" dibuat`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdatePlan(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePlanInput) => updatePlan(id, input),
    onSuccess: (plan) => {
      qc.invalidateQueries({ queryKey: ['plans'] })
      toast.success(`Paket "${plan.name}" diperbarui`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useArchivePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => archivePlan(id),
    onSuccess: (plan) => {
      qc.invalidateQueries({ queryKey: ['plans'] })
      toast.success(`Paket "${plan.name}" diarsipkan`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

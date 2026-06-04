import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { createPlan, listPlans } from '@/api/plans'
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
      toast.success(`Plan "${plan.name}" created`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

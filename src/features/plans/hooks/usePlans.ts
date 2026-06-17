import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  archivePlan,
  createPlan,
  listPlans,
  PLAN_EXPORT_LIMIT,
  type PlanFilter,
  updatePlan,
} from '@/api/plans'
import { getErrorMessage } from '@/lib/errors'
import type { CreatePlanInput, PlanList } from '@/schemas/plan'

export function usePlansList(filter: PlanFilter = {}) {
  return useQuery({
    queryKey: ['plans', 'list', filter] as const,
    queryFn: () => listPlans(filter),
  })
}

// Export the full filtered set (server pagination keeps only the page in the
// table) by fetching a single max-size page through the query cache.
export function useExportPlans() {
  const qc = useQueryClient()
  return (filter: PlanFilter): Promise<PlanList> => {
    const exportFilter: PlanFilter = {
      ...filter,
      limit: PLAN_EXPORT_LIMIT,
      offset: 0,
    }
    return qc.fetchQuery({
      queryKey: ['plans', 'list', exportFilter] as const,
      queryFn: () => listPlans(exportFilter),
    })
  }
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

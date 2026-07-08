import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { convertLead, createLead, listLeads, updateLeadStage } from '@/api/leads'
import { customerKeys } from '@/features/customers/queries/keys'
import { workOrderKeys } from '@/features/work-orders/queries/keys'
import { getErrorMessage } from '@/lib/errors'
import type { CreateLeadInput, LeadStage } from '@/schemas/lead'
import { leadKeys } from '../queries/keys'

export function useLeads() {
  return useQuery({ queryKey: leadKeys.list(), queryFn: listLeads })
}

export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateLeadInput) => createLead(input),
    onSuccess: (lead) => {
      qc.invalidateQueries({ queryKey: leadKeys.all })
      toast.success(`Prospek "${lead.name}" ditambahkan`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateLeadStage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: LeadStage }) => updateLeadStage(id, stage),
    onSuccess: () => qc.invalidateQueries({ queryKey: leadKeys.all }),
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useConvertLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => convertLead(id),
    onSuccess: (lead) => {
      qc.invalidateQueries({ queryKey: leadKeys.all })
      qc.invalidateQueries({ queryKey: customerKeys.all })
      qc.invalidateQueries({ queryKey: workOrderKeys.all })
      toast.success(`"${lead.name}" dikonversi → pelanggan + WO instalasi`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

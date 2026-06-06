import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { convertLead, createLead, listLeads, updateLeadStage } from '@/api/leads'
import { getErrorMessage } from '@/lib/errors'
import type { CreateLeadInput, LeadStage } from '@/schemas/lead'

export function useLeads() {
  return useQuery({ queryKey: ['leads', 'list'] as const, queryFn: listLeads })
}

export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateLeadInput) => createLead(input),
    onSuccess: (lead) => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      toast.success(`Prospek "${lead.name}" ditambahkan`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateLeadStage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: LeadStage }) => updateLeadStage(id, stage),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useConvertLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => convertLead(id),
    onSuccess: (lead) => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['work-orders'] })
      toast.success(`"${lead.name}" dikonversi → pelanggan + WO instalasi`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

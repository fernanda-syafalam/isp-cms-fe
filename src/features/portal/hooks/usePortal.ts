import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  addPortalComment,
  getPortalMe,
  getPortalTicket,
  reportIssue,
  submitCsat,
} from '@/api/portal'
import { getErrorMessage } from '@/lib/errors'
import type { ReportIssueInput } from '@/schemas/portal'
import type { AddCommentInput, SubmitCsatInput } from '@/schemas/ticket'

export function usePortalMe() {
  return useQuery({
    queryKey: ['portal', 'me'] as const,
    queryFn: getPortalMe,
  })
}

export function useReportIssue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ReportIssueInput) => reportIssue(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal', 'me'] })
      qc.invalidateQueries({ queryKey: ['tickets'] })
      toast.success('Laporan gangguan terkirim — tim kami segera menindaklanjuti')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function usePortalTicket(id: string) {
  return useQuery({
    queryKey: ['portal', 'ticket', id] as const,
    queryFn: () => getPortalTicket(id),
  })
}

export function useAddPortalComment(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AddCommentInput) => addPortalComment(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal', 'ticket', id] })
      qc.invalidateQueries({ queryKey: ['portal', 'me'] })
      toast.success('Komentar terkirim')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useSubmitCsat(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SubmitCsatInput) => submitCsat(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal', 'ticket', id] })
      qc.invalidateQueries({ queryKey: ['portal', 'me'] })
      toast.success('Terima kasih atas penilaian Anda')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

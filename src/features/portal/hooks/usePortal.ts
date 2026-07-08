import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  addPortalComment,
  getPortalAnnouncements,
  getPortalMe,
  getPortalTicket,
  getPortalUsage,
  getPortalWifi,
  reportIssue,
  submitCsat,
  updatePortalWifi,
} from '@/api/portal'
import { ticketKeys } from '@/features/tickets/queries/keys'
import { getErrorMessage } from '@/lib/errors'
import type { PortalWifiUpdate, ReportIssueInput } from '@/schemas/portal'
import type { AddCommentInput, SubmitCsatInput } from '@/schemas/ticket'
import { portalKeys } from '../queries/keys'

export function usePortalMe() {
  return useQuery({
    queryKey: portalKeys.me(),
    queryFn: getPortalMe,
  })
}

export function useReportIssue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ReportIssueInput) => reportIssue(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: portalKeys.me() })
      qc.invalidateQueries({ queryKey: ticketKeys.all })
      toast.success('Laporan gangguan terkirim — tim kami segera menindaklanjuti')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function usePortalUsage() {
  return useQuery({
    queryKey: portalKeys.usage(),
    queryFn: getPortalUsage,
  })
}

export function usePortalWifi() {
  return useQuery({
    queryKey: portalKeys.wifi(),
    queryFn: getPortalWifi,
  })
}

export function useUpdatePortalWifi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: PortalWifiUpdate) => updatePortalWifi(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: portalKeys.wifi() })
      toast.success('Pengaturan Wi-Fi berhasil diperbarui')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function usePortalAnnouncements() {
  return useQuery({
    queryKey: portalKeys.announcements(),
    queryFn: getPortalAnnouncements,
  })
}

export function usePortalTicket(id: string) {
  return useQuery({
    queryKey: portalKeys.ticket(id),
    queryFn: () => getPortalTicket(id),
  })
}

export function useAddPortalComment(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AddCommentInput) => addPortalComment(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: portalKeys.ticket(id) })
      qc.invalidateQueries({ queryKey: portalKeys.me() })
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
      qc.invalidateQueries({ queryKey: portalKeys.ticket(id) })
      qc.invalidateQueries({ queryKey: portalKeys.me() })
      toast.success('Terima kasih atas penilaian Anda')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

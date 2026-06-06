import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getPortalMe, reportIssue } from '@/api/portal'
import { getErrorMessage } from '@/lib/errors'
import type { ReportIssueInput } from '@/schemas/portal'

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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  acknowledgeAlert,
  createTicketFromAlert,
  listAlerts,
  listDeviceMetrics,
} from '@/api/monitoring'
import { getErrorMessage } from '@/lib/errors'

export function useDeviceMetrics() {
  return useQuery({
    queryKey: ['monitoring', 'metrics'] as const,
    queryFn: listDeviceMetrics,
  })
}

export function useAlerts() {
  return useQuery({
    queryKey: ['monitoring', 'alerts'] as const,
    queryFn: listAlerts,
  })
}

export function useAcknowledgeAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => acknowledgeAlert(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['monitoring', 'alerts'] })
      toast.success('Alert ditandai sudah ditangani')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useCreateTicketFromAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => createTicketFromAlert(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['monitoring', 'alerts'] })
      qc.invalidateQueries({ queryKey: ['tickets'] })
      toast.success('Tiket dibuat dari alert')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

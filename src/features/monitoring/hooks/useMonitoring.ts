import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  acknowledgeAlert,
  createTicketFromAlert,
  type DeviceMetricFilter,
  listAlerts,
  listDeviceMetrics,
} from '@/api/monitoring'
import { monitoringKeys } from '@/features/monitoring/queries/keys'
import { ticketKeys } from '@/features/tickets/queries/keys'
import { getErrorMessage } from '@/lib/errors'

export function useDeviceMetrics(filter: DeviceMetricFilter = {}) {
  return useQuery({
    queryKey: monitoringKeys.metrics(filter),
    queryFn: () => listDeviceMetrics(filter),
  })
}

export function useAlerts() {
  return useQuery({
    queryKey: monitoringKeys.alerts(),
    queryFn: listAlerts,
  })
}

export function useAcknowledgeAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => acknowledgeAlert(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: monitoringKeys.alerts() })
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
      qc.invalidateQueries({ queryKey: monitoringKeys.alerts() })
      qc.invalidateQueries({ queryKey: ticketKeys.all })
      toast.success('Tiket dibuat dari alert')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  type WorkOrderFilter,
  WORKORDER_EXPORT_LIMIT,
  assignWorkOrder,
  cancelWorkOrder,
  completeWorkOrder,
  listWorkOrders,
  rescheduleWorkOrder,
  startWorkOrder,
} from '@/api/workorders'
import { getErrorMessage } from '@/lib/errors'

export function useWorkOrdersList(filter: WorkOrderFilter = {}) {
  return useQuery({
    queryKey: ['work-orders', 'list', filter] as const,
    queryFn: () => listWorkOrders(filter),
  })
}

/**
 * Returns a callback that fetches the full filtered work-order set (one
 * max-size page) for CSV export. With server pagination the table only holds
 * the current page, so export must re-query without the page window.
 */
export function useExportWorkOrders() {
  const qc = useQueryClient()
  return (filter: WorkOrderFilter = {}) => {
    const exportFilter: WorkOrderFilter = {
      ...filter,
      limit: WORKORDER_EXPORT_LIMIT,
      offset: 0,
    }
    return qc.fetchQuery({
      queryKey: ['work-orders', 'list', exportFilter] as const,
      queryFn: () => listWorkOrders(exportFilter),
    })
  }
}

export function useCompleteWorkOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => completeWorkOrder(id),
    onSuccess: (wo) => {
      qc.invalidateQueries({ queryKey: ['work-orders'] })
      // An install completion activates + provisions + invoices the customer,
      // and turns its topology node green (up).
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['topology'] })
      // An install consumes an ONU from the warehouse.
      qc.invalidateQueries({ queryKey: ['inventory'] })
      // …and provisions a PPPoE secret on a router.
      qc.invalidateQueries({ queryKey: ['routers'] })
      toast.success(
        wo.type === 'install'
          ? `WO ${wo.code} selesai — pelanggan diaktifkan & tagihan pertama dibuat`
          : `WO ${wo.code} selesai`,
      )
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useStartWorkOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => startWorkOrder(id),
    onSuccess: (wo) => {
      qc.invalidateQueries({ queryKey: ['work-orders'] })
      toast.success(`WO ${wo.code} dimulai`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useCancelWorkOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelWorkOrder(id),
    onSuccess: (wo) => {
      qc.invalidateQueries({ queryKey: ['work-orders'] })
      toast.success(`WO ${wo.code} dibatalkan`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useAssignWorkOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, technician }: { id: string; technician: string }) =>
      assignWorkOrder(id, technician),
    onSuccess: (wo) => {
      qc.invalidateQueries({ queryKey: ['work-orders'] })
      toast.success(`WO ${wo.code} ditugaskan ke ${wo.technician}`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useRescheduleWorkOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: string }) =>
      rescheduleWorkOrder(id, scheduledAt),
    onSuccess: (wo) => {
      qc.invalidateQueries({ queryKey: ['work-orders'] })
      toast.success(`Jadwal WO ${wo.code} diperbarui`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

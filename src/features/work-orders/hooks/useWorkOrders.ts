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
import { customerKeys } from '@/features/customers/queries/keys'
import { inventoryKeys } from '@/features/inventory/queries/keys'
import { invoiceKeys } from '@/features/invoices/queries/keys'
import { routerKeys } from '@/features/routers/queries/keys'
import { ticketKeys } from '@/features/tickets/queries/keys'
import { topologyKeys } from '@/features/topology/queries/keys'
import { workOrderKeys } from '@/features/work-orders/queries/keys'
import { getErrorMessage } from '@/lib/errors'
import type { CompleteWorkOrderInput } from '@/schemas/workorder'

export function useWorkOrdersList(filter: WorkOrderFilter = {}) {
  return useQuery({
    queryKey: workOrderKeys.list(filter),
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
      queryKey: workOrderKeys.list(exportFilter),
      queryFn: () => listWorkOrders(exportFilter),
    })
  }
}

export function useCompleteWorkOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: CompleteWorkOrderInput }) =>
      completeWorkOrder(id, input),
    onSuccess: (wo) => {
      qc.invalidateQueries({ queryKey: workOrderKeys.all })
      // An install completion activates + provisions + invoices the customer,
      // and turns its topology node green (up).
      qc.invalidateQueries({ queryKey: customerKeys.all })
      qc.invalidateQueries({ queryKey: invoiceKeys.all })
      qc.invalidateQueries({ queryKey: topologyKeys.all })
      // An install consumes an ONU from the warehouse.
      qc.invalidateQueries({ queryKey: inventoryKeys.all })
      // …and provisions a PPPoE secret on a router.
      qc.invalidateQueries({ queryKey: routerKeys.all })
      // A repair completion auto-resolves the linked ticket (P3.B.4) — refresh
      // the ticket list + timeline so it reflects the close.
      qc.invalidateQueries({ queryKey: ticketKeys.all })
      toast.success(
        wo.type === 'install'
          ? `WO ${wo.code} selesai — pelanggan diaktifkan & tagihan pertama dibuat`
          : wo.ticketId
            ? `WO ${wo.code} selesai — tiket terkait ditutup`
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
      qc.invalidateQueries({ queryKey: workOrderKeys.all })
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
      qc.invalidateQueries({ queryKey: workOrderKeys.all })
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
      qc.invalidateQueries({ queryKey: workOrderKeys.all })
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
      qc.invalidateQueries({ queryKey: workOrderKeys.all })
      toast.success(`Jadwal WO ${wo.code} diperbarui`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

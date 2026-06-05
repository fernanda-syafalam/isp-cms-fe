import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { type WorkOrderFilter, completeWorkOrder, listWorkOrders } from '@/api/workorders'
import { getErrorMessage } from '@/lib/errors'

export function useWorkOrdersList(filter: WorkOrderFilter = {}) {
  return useQuery({
    queryKey: ['work-orders', 'list', filter] as const,
    queryFn: () => listWorkOrders(filter),
  })
}

export function useCompleteWorkOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => completeWorkOrder(id),
    onSuccess: (wo) => {
      qc.invalidateQueries({ queryKey: ['work-orders'] })
      // An install completion activates + provisions + invoices the customer.
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['invoices'] })
      toast.success(
        wo.type === 'install'
          ? `WO ${wo.code} selesai — pelanggan diaktifkan & tagihan pertama dibuat`
          : `WO ${wo.code} selesai`,
      )
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

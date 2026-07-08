import { useQuery, useQueryClient } from '@tanstack/react-query'

import {
  PAYMENT_EXPORT_LIMIT,
  type PaymentFilter,
  getReconciliation,
  listPayments,
} from '@/api/payments'
import { paymentKeys } from '@/features/payments/queries/keys'

// End-of-day cash-drawer + per-method reconciliation for a single date.
export function useReconciliation(date: string) {
  return useQuery({
    queryKey: paymentKeys.reconciliation(date),
    queryFn: () => getReconciliation(date),
  })
}

export function usePaymentsList(filter: PaymentFilter = {}) {
  return useQuery({
    queryKey: paymentKeys.list(filter),
    queryFn: () => listPayments(filter),
  })
}

/**
 * Returns a callback that fetches the full filtered payment set (one max-size
 * page) for CSV export. With server pagination the table holds only the current
 * page, so export must re-query without the page window.
 */
export function useExportPayments() {
  const qc = useQueryClient()
  return (filter: PaymentFilter = {}) => {
    const exportFilter: PaymentFilter = {
      ...filter,
      limit: PAYMENT_EXPORT_LIMIT,
      offset: 0,
    }
    return qc.fetchQuery({
      queryKey: paymentKeys.list(exportFilter),
      queryFn: () => listPayments(exportFilter),
    })
  }
}

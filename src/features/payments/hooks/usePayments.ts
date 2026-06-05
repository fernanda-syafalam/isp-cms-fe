import { useQuery } from '@tanstack/react-query'

import { listPayments } from '@/api/payments'

export function usePaymentsList() {
  return useQuery({
    queryKey: ['payments', 'list'] as const,
    queryFn: listPayments,
  })
}

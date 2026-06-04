import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { type CustomerFilter, createCustomer, getCustomer, listCustomers } from '@/api/customers'
import { getErrorMessage } from '@/lib/errors'
import type { CreateCustomerInput } from '@/schemas/customer'

export function useCustomersList(filter: CustomerFilter = {}) {
  return useQuery({
    queryKey: ['customers', 'list', filter] as const,
    queryFn: () => listCustomers(filter),
  })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customers', 'detail', id] as const,
    queryFn: () => getCustomer(id),
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCustomerInput) => createCustomer(input),
    onSuccess: (customer) => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      toast.success(`Customer "${customer.fullName}" created`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

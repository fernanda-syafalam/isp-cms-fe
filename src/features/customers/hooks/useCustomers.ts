import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  type CustomerFilter,
  activateCustomer,
  createCustomer,
  getCustomer,
  isolateCustomer,
  listCustomers,
} from '@/api/customers'
import { getErrorMessage } from '@/lib/errors'
import type { Customer, CreateCustomerInput } from '@/schemas/customer'

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
      toast.success(`Pelanggan "${customer.fullName}" dibuat`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

function syncCustomerCaches(qc: ReturnType<typeof useQueryClient>, customer: Customer) {
  qc.setQueryData(['customers', 'detail', customer.id], customer)
  qc.invalidateQueries({ queryKey: ['customers', 'list'] })
}

export function useIsolateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => isolateCustomer(id),
    onSuccess: (customer) => {
      syncCustomerCaches(qc, customer)
      toast.success(`Pelanggan "${customer.fullName}" diisolir`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useActivateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => activateCustomer(id),
    onSuccess: (customer) => {
      syncCustomerCaches(qc, customer)
      toast.success(`Pelanggan "${customer.fullName}" diaktifkan`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

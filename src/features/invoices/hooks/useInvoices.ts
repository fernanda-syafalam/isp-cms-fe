import { useQuery } from '@tanstack/react-query'

import { type InvoiceFilter, getInvoice, listInvoices } from '@/api/invoices'

export function useInvoicesList(filter: InvoiceFilter = {}) {
  return useQuery({
    queryKey: ['invoices', 'list', filter] as const,
    queryFn: () => listInvoices(filter),
  })
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoices', 'detail', id] as const,
    queryFn: () => getInvoice(id),
  })
}

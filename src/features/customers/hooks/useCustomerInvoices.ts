import { useQuery } from '@tanstack/react-query'

import { listInvoices } from '@/api/invoices'

// Recent invoices for one customer. Reads the invoices API (allowed: a feature
// may depend on the shared api layer) and filters client-side; the real backend
// will expose a per-customer endpoint later.
export function useCustomerInvoices(customerId: string) {
  return useQuery({
    queryKey: ['invoices', 'by-customer', customerId] as const,
    queryFn: () => listInvoices(),
    select: (data) => data.items.filter((inv) => inv.customerId === customerId).slice(0, 5),
  })
}

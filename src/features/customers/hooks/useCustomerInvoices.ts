import { useQuery } from '@tanstack/react-query'

import { listInvoices } from '@/api/invoices'
import { invoiceKeys } from '@/features/invoices/queries/keys'

// Recent invoices for one customer. Reads the invoices API (allowed: a feature
// may depend on the shared api layer) and filters client-side; the real backend
// will expose a per-customer endpoint later.
export function useCustomerInvoices(customerId: string) {
  return useQuery({
    queryKey: invoiceKeys.byCustomer(customerId),
    queryFn: () => listInvoices(),
    select: (data) => data.items.filter((inv) => inv.customerId === customerId).slice(0, 5),
  })
}

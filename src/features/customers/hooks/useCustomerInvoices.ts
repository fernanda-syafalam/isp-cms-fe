import { useQuery } from '@tanstack/react-query'

import { listInvoices } from '@/api/invoices'
import { invoiceKeys } from '@/features/invoices/queries/keys'

const RECENT_LIMIT = 5

// Recent invoices for one customer. The server filters by `customerId`; the
// client-side filter + slice is a safety net for an older backend that ignores
// the param. No `limit` is sent: an old backend would obey it and return the
// newest rows of ALL customers, which the safety filter would then empty.
export function useCustomerInvoices(customerId: string) {
  return useQuery({
    queryKey: invoiceKeys.byCustomer(customerId),
    queryFn: () => listInvoices({ customerId }),
    select: (data) =>
      data.items.filter((inv) => inv.customerId === customerId).slice(0, RECENT_LIMIT),
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  INVOICE_EXPORT_LIMIT,
  type InvoiceFilter,
  getInvoice,
  listInvoices,
  payInvoice,
} from '@/api/invoices'
import { getErrorMessage } from '@/lib/errors'
import { formatCurrency } from '@/lib/format'
import type { InvoiceList } from '@/schemas/invoice'
import type { RecordPaymentInput } from '@/schemas/payment'

export function useInvoicesList(filter: InvoiceFilter = {}) {
  return useQuery({
    queryKey: ['invoices', 'list', filter] as const,
    queryFn: () => listInvoices(filter),
  })
}

// Export the full filtered set (server pagination keeps only the page in the
// table) by fetching a single max-size page through the query cache.
export function useExportInvoices() {
  const qc = useQueryClient()
  return (filter: InvoiceFilter): Promise<InvoiceList> => {
    const exportFilter: InvoiceFilter = {
      ...filter,
      limit: INVOICE_EXPORT_LIMIT,
      offset: 0,
    }
    return qc.fetchQuery({
      queryKey: ['invoices', 'list', exportFilter] as const,
      queryFn: () => listInvoices(exportFilter),
    })
  }
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoices', 'detail', id] as const,
    queryFn: () => getInvoice(id),
  })
}

export function usePayInvoice(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: RecordPaymentInput) => payInvoice(id, input),
    onSuccess: (invoice) => {
      qc.setQueryData(['invoices', 'detail', id], invoice)
      qc.invalidateQueries({ queryKey: ['invoices', 'list'] })
      qc.invalidateQueries({ queryKey: ['payments'] })
      // payment can reactivate an isolated customer + change AR
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
      // A partial payment still owes balanceDue — say so instead of implying paid.
      if (invoice.status === 'partial') {
        toast.success(
          `Pembayaran sebagian ${invoice.invoiceNo} dicatat · sisa ${formatCurrency(invoice.balanceDue)}`,
        )
      } else {
        toast.success(`Pembayaran ${invoice.invoiceNo} dicatat`)
      }
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

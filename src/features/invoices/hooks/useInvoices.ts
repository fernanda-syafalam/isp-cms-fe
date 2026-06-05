import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { type InvoiceFilter, getInvoice, listInvoices, payInvoice } from '@/api/invoices'
import { getErrorMessage } from '@/lib/errors'
import type { RecordPaymentInput } from '@/schemas/payment'

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

export function usePayInvoice(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: RecordPaymentInput) => payInvoice(id, input),
    onSuccess: (invoice) => {
      qc.setQueryData(['invoices', 'detail', id], invoice)
      qc.invalidateQueries({ queryKey: ['invoices', 'list'] })
      qc.invalidateQueries({ queryKey: ['payments'] })
      // payment can reactivate an isolated customer
      qc.invalidateQueries({ queryKey: ['customers'] })
      toast.success(`Pembayaran ${invoice.invoiceNo} dicatat`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

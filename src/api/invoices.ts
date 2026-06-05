import { api } from './client'
import { type Invoice, InvoiceListSchema, InvoiceSchema, type InvoiceList } from '@/schemas/invoice'
import type { RecordPaymentInput } from '@/schemas/payment'

export type InvoiceFilter = {
  status?: string | undefined
}

export async function listInvoices(filter: InvoiceFilter = {}): Promise<InvoiceList> {
  const searchParams = new URLSearchParams()
  if (filter.status) searchParams.set('status', filter.status)
  const json = await api.get('invoices', { searchParams }).json()
  return InvoiceListSchema.parse(json)
}

export async function getInvoice(id: string): Promise<Invoice> {
  const json = await api.get(`invoices/${id}`).json()
  return InvoiceSchema.parse(json)
}

// Record a payment against an invoice (mock; real backend reconciles + reactivates
// the customer). Returns the updated, now-paid invoice.
export async function payInvoice(id: string, input: RecordPaymentInput): Promise<Invoice> {
  const json = await api.post(`invoices/${id}/pay`, { json: input }).json()
  return InvoiceSchema.parse(json)
}

import { api } from './client'
import { type Invoice, InvoiceListSchema, InvoiceSchema, type InvoiceList } from '@/schemas/invoice'
import type { RecordPaymentInput } from '@/schemas/payment'

export type InvoiceFilter = {
  status?: string | undefined
  q?: string | undefined
  sort?: string | undefined
  order?: 'asc' | 'desc' | undefined
  limit?: number | undefined
  offset?: number | undefined
}

// Backend caps a page at 200 rows; the CSV export pulls a single max-size page
// so it covers the full filtered set without a paging loop.
export const INVOICE_EXPORT_LIMIT = 200

export async function listInvoices(filter: InvoiceFilter = {}): Promise<InvoiceList> {
  const searchParams = new URLSearchParams()
  if (filter.status) searchParams.set('status', filter.status)
  if (filter.q) searchParams.set('q', filter.q)
  if (filter.sort) searchParams.set('sort', filter.sort)
  if (filter.order) searchParams.set('order', filter.order)
  if (filter.limit !== undefined) searchParams.set('limit', String(filter.limit))
  if (filter.offset !== undefined) searchParams.set('offset', String(filter.offset))
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

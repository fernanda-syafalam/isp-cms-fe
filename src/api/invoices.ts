import { api } from './client'
import { type Invoice, InvoiceListSchema, InvoiceSchema, type InvoiceList } from '@/schemas/invoice'

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

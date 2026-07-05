import { api } from './client'
import {
  type CreatePaymentIntentInput,
  type PaymentIntent,
  PaymentIntentSchema,
  type PaymentList,
  PaymentListSchema,
  type PaymentReconciliation,
  PaymentReconciliationSchema,
} from '@/schemas/payment'

export type PaymentFilter = {
  method?: string | undefined
  q?: string | undefined
  sort?: string | undefined
  order?: 'asc' | 'desc' | undefined
  limit?: number | undefined
  offset?: number | undefined
}

// Backend caps a page at 200 rows; the CSV export pulls a single max-size page
// so it covers the full filtered set without a paging loop.
export const PAYMENT_EXPORT_LIMIT = 200

export async function listPayments(filter: PaymentFilter = {}): Promise<PaymentList> {
  const searchParams = new URLSearchParams()
  if (filter.method) searchParams.set('method', filter.method)
  if (filter.q) searchParams.set('q', filter.q)
  if (filter.sort) searchParams.set('sort', filter.sort)
  if (filter.order) searchParams.set('order', filter.order)
  if (filter.limit !== undefined) searchParams.set('limit', String(filter.limit))
  if (filter.offset !== undefined) searchParams.set('offset', String(filter.offset))
  const json = await api.get('payments', { searchParams }).json()
  return PaymentListSchema.parse(json)
}

// End-of-day cash-drawer + per-method reconciliation for a single date
// (YYYY-MM-DD). Admin/staff only on the backend.
export async function getReconciliation(date: string): Promise<PaymentReconciliation> {
  const searchParams = new URLSearchParams({ date })
  const json = await api.get('payments/reconciliation', { searchParams }).json()
  return PaymentReconciliationSchema.parse(json)
}

// Create a gateway charge for an invoice (mock returns VA/QR + pending status).
export async function createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntent> {
  const json = await api.post('payments/intent', { json: input }).json()
  return PaymentIntentSchema.parse(json)
}

// Simulate the gateway settlement webhook: marks the intent + invoice paid.
export async function confirmPaymentIntent(id: string): Promise<PaymentIntent> {
  const json = await api.post(`payments/intent/${id}/confirm`).json()
  return PaymentIntentSchema.parse(json)
}

import { api } from './client'
import {
  type GenerateVoucherBatchInput,
  type Voucher,
  type VoucherBatchResult,
  VoucherBatchResultSchema,
  type VoucherList,
  VoucherListSchema,
  VoucherSchema,
} from '@/schemas/voucher'

export type VoucherFilter = {
  status?: string | undefined
  q?: string | undefined
  sort?: string | undefined
  order?: 'asc' | 'desc' | undefined
  limit?: number | undefined
  offset?: number | undefined
}

// Backend caps a page at 200 rows; the CSV export pulls a single max-size page
// so it covers the full filtered set without a paging loop.
export const VOUCHER_EXPORT_LIMIT = 200

export async function listVouchers(filter: VoucherFilter = {}): Promise<VoucherList> {
  const searchParams = new URLSearchParams()
  if (filter.status) searchParams.set('status', filter.status)
  if (filter.q) searchParams.set('q', filter.q)
  if (filter.sort) searchParams.set('sort', filter.sort)
  if (filter.order) searchParams.set('order', filter.order)
  if (filter.limit !== undefined) searchParams.set('limit', String(filter.limit))
  if (filter.offset !== undefined) searchParams.set('offset', String(filter.offset))
  const json = await api.get('vouchers', { searchParams }).json()
  return VoucherListSchema.parse(json)
}

// Generate a batch of identical prepaid vouchers (mock).
export async function generateVoucherBatch(
  input: GenerateVoucherBatchInput,
): Promise<VoucherBatchResult> {
  const json = await api.post('vouchers/batch', { json: input }).json()
  return VoucherBatchResultSchema.parse(json)
}

// Redeem a voucher — a real loket settlement: mark it used and write a payment
// applied to the customer's unpaid invoices. Takes no request body.
export async function redeemVoucher(id: string): Promise<Voucher> {
  const json = await api.post(`vouchers/${id}/redeem`).json()
  return VoucherSchema.parse(json)
}

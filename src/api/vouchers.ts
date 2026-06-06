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
}

export async function listVouchers(filter: VoucherFilter = {}): Promise<VoucherList> {
  const searchParams = new URLSearchParams()
  if (filter.status) searchParams.set('status', filter.status)
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

// Mark a voucher as redeemed (mock; a real gateway flips this from RADIUS).
export async function redeemVoucher(id: string): Promise<Voucher> {
  const json = await api.post(`vouchers/${id}/redeem`).json()
  return VoucherSchema.parse(json)
}

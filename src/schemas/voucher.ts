import { z } from 'zod'

import { voucherId } from '@/types/ids'

// Lifecycle of a prepaid voucher (hotspot/PPPoE): generated → redeemed, or
// it lapses unused past its sell-by window.
export const VoucherStatusSchema = z.enum(['unused', 'used', 'expired'])

export const VoucherSchema = z.object({
  id: voucherId,
  code: z.string(), // redeemable code, e.g. "ASH-7F3K-2M9P"
  batchId: z.string(), // groups vouchers generated together
  profile: z.string(), // hotspot/PPPoE profile sold, e.g. "Hotspot 1 Hari"
  priceIdr: z.number().int().nonnegative(),
  durationDays: z.number().int().positive(), // validity once redeemed
  status: VoucherStatusSchema,
  createdAt: z.iso.datetime(),
  usedAt: z.iso.datetime().nullable(),
  usedBy: z.string().nullable(), // who redeemed it (free-text in mock)
})

export const VoucherListSchema = z.object({
  items: z.array(VoucherSchema),
  total: z.number().int().nonnegative(),
})

// Generate a batch of identical vouchers in one go.
export const GenerateVoucherBatchSchema = z.object({
  count: z.number().int().min(1, 'Minimal 1 voucher').max(500, 'Maksimal 500 per batch'),
  profile: z.string().min(1, 'Profil wajib diisi').max(80),
  priceIdr: z.number().int().nonnegative(),
  durationDays: z.number().int().positive().max(365),
})

// Result of a batch generation: the shared batch id + how many were created.
export const VoucherBatchResultSchema = z.object({
  batchId: z.string(),
  created: z.number().int().nonnegative(),
})

export type VoucherStatus = z.infer<typeof VoucherStatusSchema>
export type Voucher = z.infer<typeof VoucherSchema>
export type VoucherList = z.infer<typeof VoucherListSchema>
export type GenerateVoucherBatchInput = z.infer<typeof GenerateVoucherBatchSchema>
export type VoucherBatchResult = z.infer<typeof VoucherBatchResultSchema>

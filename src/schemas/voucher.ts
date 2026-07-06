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
  // Reseller/mitra attribution (P3.D.3): a batch (or a single redemption) can be
  // credited to a mitra so redeeming the voucher posts them a commission.
  resellerId: z.string().nullable(),
  resellerName: z.string().nullable().optional(),
})

// Full-set rollup over ALL vouchers, computed before any status/q filter or
// paging — so the KPI cards stay a dashboard invariant under any table filter
// (mirrors the accounting journal `totals` invariant).
export const VoucherSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  unused: z.number().int().nonnegative(),
  used: z.number().int().nonnegative(),
  expired: z.number().int().nonnegative(),
  revenue: z.number().int().nonnegative(), // sum of priceIdr over redeemed vouchers
})

export const VoucherListSchema = z.object({
  items: z.array(VoucherSchema),
  // Count AFTER status+q filtering but BEFORE limit/offset paging — drives the
  // table's page count. `items` is the current page; `total` the filtered set.
  total: z.number().int().nonnegative(),
  summary: VoucherSummarySchema,
})

// Generate a batch of identical vouchers in one go.
export const GenerateVoucherBatchSchema = z.object({
  count: z.number().int().min(1, 'Minimal 1 voucher').max(500, 'Maksimal 500 per batch'),
  profile: z.string().min(1, 'Profil wajib diisi').max(80),
  priceIdr: z.number().int().nonnegative(),
  durationDays: z.number().int().positive().max(365),
  // Attribute the whole batch to a mitra/reseller (optional).
  resellerId: z.string().nullable().optional(),
})

// Redeem a single voucher. `resellerId` optionally overrides the batch's mitra
// for this one redemption (loket voucher settlement, P3.D.3).
export const RedeemVoucherSchema = z.object({
  resellerId: z.string().nullable().optional(),
})

// Result of a batch generation: the shared batch id + how many were created.
export const VoucherBatchResultSchema = z.object({
  batchId: z.string(),
  created: z.number().int().nonnegative(),
})

export type VoucherStatus = z.infer<typeof VoucherStatusSchema>
export type Voucher = z.infer<typeof VoucherSchema>
export type VoucherSummary = z.infer<typeof VoucherSummarySchema>
export type VoucherList = z.infer<typeof VoucherListSchema>
export type GenerateVoucherBatchInput = z.infer<typeof GenerateVoucherBatchSchema>
export type VoucherBatchResult = z.infer<typeof VoucherBatchResultSchema>
export type RedeemVoucherInput = z.infer<typeof RedeemVoucherSchema>

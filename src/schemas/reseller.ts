import { z } from 'zod'

import { resellerId } from '@/types/ids'

export const ResellerStatusSchema = z.enum(['active', 'inactive'])

export const ResellerSchema = z.object({
  id: resellerId,
  name: z.string().min(1),
  area: z.string(),
  balance: z.number().int().nonnegative(), // saldo deposit (IDR)
  commissionPct: z.number().nonnegative(),
  customerCount: z.number().int().nonnegative(),
  status: ResellerStatusSchema,
})

// Full-set rollups over ALL resellers (ignores the status filter) — drives the
// KPI cards and the status filter tabs.
export const ResellerSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  totalBalance: z.number().int().nonnegative(),
  byStatus: z.object({
    active: z.number().int().nonnegative(),
    inactive: z.number().int().nonnegative(),
  }),
})

export const ResellerListSchema = z.object({
  items: z.array(ResellerSchema),
  total: z.number().int().nonnegative(),
  summary: ResellerSummarySchema,
})

export const UpdateResellerSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(120).optional(),
  area: z.string().min(1, 'Area wajib diisi').max(120).optional(),
  commissionPct: z.number().nonnegative().max(100).optional(),
  status: ResellerStatusSchema.optional(),
})

// Create a reseller (admin/staff). commissionPct matches the existing edit form
// and the BE contract: a percent in 0..100 (the display layer divides by 100).
export const CreateResellerSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(120),
  area: z.string().min(1, 'Area wajib diisi').max(120),
  commissionPct: z
    .number('Komisi wajib diisi')
    .nonnegative('Komisi tidak boleh negatif')
    .max(100, 'Komisi maksimal 100'),
  status: ResellerStatusSchema.optional(),
})

// Deposit/commission ledger. Positive entries (topup, commission) raise the
// balance; negative ones (deduction, withdrawal) lower it.
export const LedgerEntryTypeSchema = z.enum(['topup', 'commission', 'deduction', 'withdrawal'])

export const LedgerEntrySchema = z.object({
  id: z.string(),
  resellerId: resellerId,
  type: LedgerEntryTypeSchema,
  amount: z.number().int(), // signed (IDR)
  note: z.string(),
  balanceAfter: z.number().int().nonnegative(),
  at: z.iso.datetime(),
})

export const LedgerListSchema = z.object({
  items: z.array(LedgerEntrySchema),
  total: z.number().int().nonnegative(),
})

// Operator submits a positive amount + a type; the sign is applied server-side.
export const AddLedgerEntrySchema = z.object({
  type: LedgerEntryTypeSchema,
  amount: z.number().int().positive('Jumlah harus lebih dari 0'),
  note: z.string().max(200).optional(),
})

// Payout lifecycle (P3.D.4): a reseller requests a cash-out of their balance;
// admin/staff approve/reject, then disburse (which debits the balance via a
// `withdrawal` ledger entry). Replaces the old direct withdrawal ledger post.
export const PayoutStatusSchema = z.enum(['requested', 'approved', 'rejected', 'paid'])

export const PayoutSchema = z.object({
  id: z.uuid(),
  resellerId: resellerId,
  amount: z.number().int(),
  status: PayoutStatusSchema,
  note: z.string(),
  requestedBy: z.uuid().nullable(),
  decidedBy: z.uuid().nullable(),
  ledgerEntryId: z.uuid().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  decidedAt: z.iso.datetime().nullable(),
})

export const PayoutListSchema = z.object({
  items: z.array(PayoutSchema),
  total: z.number().int().nonnegative(),
})

// The reseller submits an amount + optional note; status starts at 'requested'.
export const CreatePayoutSchema = z.object({
  amount: z
    .number('Jumlah wajib diisi')
    .int('Jumlah harus bilangan bulat')
    .positive('Jumlah harus lebih dari 0')
    .max(2_000_000_000, 'Jumlah terlalu besar'),
  note: z.string().max(200).optional(),
})

export type ResellerStatus = z.infer<typeof ResellerStatusSchema>
export type Reseller = z.infer<typeof ResellerSchema>
export type ResellerSummary = z.infer<typeof ResellerSummarySchema>
export type ResellerList = z.infer<typeof ResellerListSchema>
export type UpdateResellerInput = z.infer<typeof UpdateResellerSchema>
export type LedgerEntryType = z.infer<typeof LedgerEntryTypeSchema>
export type LedgerEntry = z.infer<typeof LedgerEntrySchema>
export type LedgerList = z.infer<typeof LedgerListSchema>
export type AddLedgerEntryInput = z.infer<typeof AddLedgerEntrySchema>
export type CreateResellerInput = z.infer<typeof CreateResellerSchema>
export type PayoutStatus = z.infer<typeof PayoutStatusSchema>
export type Payout = z.infer<typeof PayoutSchema>
export type PayoutList = z.infer<typeof PayoutListSchema>
export type CreatePayoutInput = z.infer<typeof CreatePayoutSchema>

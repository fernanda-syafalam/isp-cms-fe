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

export const ResellerListSchema = z.object({
  items: z.array(ResellerSchema),
  total: z.number().int().nonnegative(),
})

export const UpdateResellerSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(120).optional(),
  area: z.string().min(1, 'Area wajib diisi').max(120).optional(),
  commissionPct: z.number().nonnegative().max(100).optional(),
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

export type ResellerStatus = z.infer<typeof ResellerStatusSchema>
export type Reseller = z.infer<typeof ResellerSchema>
export type ResellerList = z.infer<typeof ResellerListSchema>
export type UpdateResellerInput = z.infer<typeof UpdateResellerSchema>
export type LedgerEntryType = z.infer<typeof LedgerEntryTypeSchema>
export type LedgerEntry = z.infer<typeof LedgerEntrySchema>
export type LedgerList = z.infer<typeof LedgerListSchema>
export type AddLedgerEntryInput = z.infer<typeof AddLedgerEntrySchema>

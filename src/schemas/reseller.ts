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

export type ResellerStatus = z.infer<typeof ResellerStatusSchema>
export type Reseller = z.infer<typeof ResellerSchema>
export type ResellerList = z.infer<typeof ResellerListSchema>

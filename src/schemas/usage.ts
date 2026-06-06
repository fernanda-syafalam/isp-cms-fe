import { z } from 'zod'

import { customerId } from '@/types/ids'

// Per-subscriber data usage for the current period (mock; a real backend reads
// RADIUS accounting). quotaGb = 0 means unlimited; fupThrottled when over quota.
export const UsageRecordSchema = z.object({
  customerId: customerId,
  customerName: z.string(),
  planName: z.string(),
  quotaGb: z.number().int().nonnegative(),
  usedGb: z.number().int().nonnegative(),
  fupThrottled: z.boolean(),
  trend: z.array(z.number().int().nonnegative()), // last 7 days, GB/day
})

export const UsageListSchema = z.object({
  items: z.array(UsageRecordSchema),
  total: z.number().int().nonnegative(),
})

export type UsageRecord = z.infer<typeof UsageRecordSchema>
export type UsageList = z.infer<typeof UsageListSchema>

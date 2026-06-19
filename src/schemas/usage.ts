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

// Full-set aggregate for the KPI cards. Computed server-side over every record
// (ignores q/sort/paging) so the cards stay correct under any table search.
export const UsageSummarySchema = z.object({
  total: z.number().int().nonnegative(), // count of all subscribers in the period
  totalUsedGb: z.number().int().nonnegative(), // sum of usedGb over all records
  throttled: z.number().int().nonnegative(), // count of FUP-throttled subscribers
  avgUsedGb: z.number().int().nonnegative(), // mean usedGb per subscriber, rounded
})

export const UsageListSchema = z.object({
  items: z.array(UsageRecordSchema),
  total: z.number().int().nonnegative(),
  summary: UsageSummarySchema,
})

export type UsageRecord = z.infer<typeof UsageRecordSchema>
export type UsageSummary = z.infer<typeof UsageSummarySchema>
export type UsageList = z.infer<typeof UsageListSchema>

import { z } from 'zod'

// Result of a monthly billing run: how many invoices were created for the period.
export const BillingRunResultSchema = z.object({
  period: z.string(), // e.g. "2026-06"
  created: z.number().int().nonnegative(),
})

// Result of bulk isolir: overdue invoices flagged + customers suspended.
export const IsolirResultSchema = z.object({
  markedOverdue: z.number().int().nonnegative(),
  isolated: z.number().int().nonnegative(),
})

export type BillingRunResult = z.infer<typeof BillingRunResultSchema>
export type IsolirResult = z.infer<typeof IsolirResultSchema>

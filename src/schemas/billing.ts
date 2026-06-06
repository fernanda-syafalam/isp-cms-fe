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

// Result of a dunning run: how many invoices got a reminder + the channel used.
export const RemindResultSchema = z.object({
  reminded: z.number().int().nonnegative(),
  channel: z.literal('whatsapp'),
})

export type BillingRunResult = z.infer<typeof BillingRunResultSchema>
export type IsolirResult = z.infer<typeof IsolirResultSchema>
export type RemindResult = z.infer<typeof RemindResultSchema>

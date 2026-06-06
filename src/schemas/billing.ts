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

// What the automated billing cycle would do next (preview, no mutation).
export const SchedulerPreviewSchema = z.object({
  toBill: z.number().int().nonnegative(), // invoices to create this period
  toRemindUpcoming: z.number().int().nonnegative(), // due within reminder window
  toRemindOverdue: z.number().int().nonnegative(), // already/▶ overdue
  toIsolir: z.number().int().nonnegative(), // customers past the grace period
})

// Result after running the full automated cycle in one pass.
export const SchedulerRunResultSchema = z.object({
  period: z.string(),
  created: z.number().int().nonnegative(),
  remindedUpcoming: z.number().int().nonnegative(),
  remindedOverdue: z.number().int().nonnegative(),
  isolated: z.number().int().nonnegative(),
})

export type BillingRunResult = z.infer<typeof BillingRunResultSchema>
export type IsolirResult = z.infer<typeof IsolirResultSchema>
export type RemindResult = z.infer<typeof RemindResultSchema>
export type SchedulerPreview = z.infer<typeof SchedulerPreviewSchema>
export type SchedulerRunResult = z.infer<typeof SchedulerRunResultSchema>

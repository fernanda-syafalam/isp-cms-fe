import { z } from 'zod'

import { planId } from '@/types/ids'

export const PlanStatusSchema = z.enum(['active', 'archived'])

export const PlanSchema = z.object({
  id: planId,
  name: z.string().min(1),
  speedMbps: z.number().int().positive(),
  priceMonthly: z.number().int().nonnegative(),
  status: PlanStatusSchema,
  // Network params the plan provisions (per FEATURES.md §4 — a plan carries
  // rate-limit/FUP, not just price). `fupGb` is the monthly fair-use quota in GB
  // (absent = unlimited); `rateLimitProfile` is the Mikrotik rate-limit string
  // (e.g. "20M/20M") the queue/PPP profile applies.
  fupGb: z.number().int().nonnegative().optional(),
  rateLimitProfile: z.string().max(40).optional(),
  // Live subscriber count on this plan (computed server-side at list time).
  subscriberCount: z.number().int().nonnegative().optional(),
})

// Full-set rollups over ALL plans (ignores the status filter) — drives the
// KPI cards and the status filter tabs.
export const PlanSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  totalSubscribers: z.number().int().nonnegative(),
  byStatus: z.object({
    active: z.number().int().nonnegative(),
    archived: z.number().int().nonnegative(),
  }),
})

export const PlanListSchema = z.object({
  items: z.array(PlanSchema),
  total: z.number().int().nonnegative(),
  summary: PlanSummarySchema,
})

export const CreatePlanSchema = z.object({
  name: z.string().min(1, 'Name is required').max(80),
  speedMbps: z.number().int().positive('Speed must be > 0'),
  priceMonthly: z.number().int().nonnegative('Price must be >= 0'),
  fupGb: z.number().int().nonnegative('FUP must be >= 0').optional(),
  rateLimitProfile: z.string().max(40).optional(),
})

export type PlanStatus = z.infer<typeof PlanStatusSchema>
export type PlanSummary = z.infer<typeof PlanSummarySchema>
export type Plan = z.infer<typeof PlanSchema>
export type PlanList = z.infer<typeof PlanListSchema>
export type CreatePlanInput = z.infer<typeof CreatePlanSchema>

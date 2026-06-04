import { z } from 'zod'

import { planId } from '@/types/ids'

export const PlanStatusSchema = z.enum(['active', 'archived'])

export const PlanSchema = z.object({
  id: planId,
  name: z.string().min(1),
  speedMbps: z.number().int().positive(),
  priceMonthly: z.number().int().nonnegative(),
  status: PlanStatusSchema,
})

export const PlanListSchema = z.object({
  items: z.array(PlanSchema),
  total: z.number().int().nonnegative(),
})

export const CreatePlanSchema = z.object({
  name: z.string().min(1, 'Name is required').max(80),
  speedMbps: z.number().int().positive('Speed must be > 0'),
  priceMonthly: z.number().int().nonnegative('Price must be >= 0'),
})

export type PlanStatus = z.infer<typeof PlanStatusSchema>
export type Plan = z.infer<typeof PlanSchema>
export type PlanList = z.infer<typeof PlanListSchema>
export type CreatePlanInput = z.infer<typeof CreatePlanSchema>

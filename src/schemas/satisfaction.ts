import { z } from 'zod'

// Customer-experience metrics: CSAT (post-ticket), NPS, churn risk (mock).
export const AtRiskCustomerSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string(),
  reason: z.string(),
  riskPct: z.number().int().min(0).max(100),
})

export const FeedbackSchema = z.object({
  id: z.string(),
  customerId: z.string().optional(),
  customerName: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string(),
  at: z.iso.datetime(),
})

export const SatisfactionSchema = z.object({
  csat: z.object({
    avg: z.number(), // 1..5
    count: z.number().int().nonnegative(),
  }),
  nps: z.object({
    score: z.number().int(), // -100..100
    promoters: z.number().int().nonnegative(),
    passives: z.number().int().nonnegative(),
    detractors: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  }),
  churn: z.object({
    rate: z.number(), // %
    atRisk: z.array(AtRiskCustomerSchema),
  }),
  recentFeedback: z.array(FeedbackSchema),
})

export type AtRiskCustomer = z.infer<typeof AtRiskCustomerSchema>
export type Feedback = z.infer<typeof FeedbackSchema>
export type Satisfaction = z.infer<typeof SatisfactionSchema>

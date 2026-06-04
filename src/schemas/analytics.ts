import { z } from 'zod'

const MonthRevenueSchema = z.object({
  month: z.string(),
  revenue: z.number().nonnegative(),
})

const StatusCountSchema = z.object({
  label: z.string(),
  count: z.number().int().nonnegative(),
})

export const DashboardSummarySchema = z.object({
  activeSubscribers: z.number().int().nonnegative(),
  newThisMonth: z.number().int(),
  mrr: z.number().int().nonnegative(),
  overdueAmount: z.number().int().nonnegative(),
  overdueCount: z.number().int().nonnegative(),
  openTickets: z.number().int().nonnegative(),
  slaCompliance: z.number().min(0).max(1),
  devicesOnline: z.number().int().nonnegative(),
  devicesTotal: z.number().int().nonnegative(),
  revenueTrend: z.array(MonthRevenueSchema),
  ticketsByStatus: z.array(StatusCountSchema),
})

const MonthMovementSchema = z.object({
  month: z.string(),
  added: z.number().int(),
  churned: z.number().int(),
})

export const ReportsSummarySchema = z.object({
  revenueTrend: z.array(MonthRevenueSchema),
  movement: z.array(MonthMovementSchema),
  arpu: z.number().int().nonnegative(),
  churnRate: z.number().min(0).max(1),
})

export type DashboardSummary = z.infer<typeof DashboardSummarySchema>
export type ReportsSummary = z.infer<typeof ReportsSummarySchema>

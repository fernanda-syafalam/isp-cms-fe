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
  isolatedSubscribers: z.number().int().nonnegative(),
  mrr: z.number().int().nonnegative(),
  arOutstanding: z.number().int().nonnegative(), // total piutang
  overdueAmount: z.number().int().nonnegative(),
  overdueCount: z.number().int().nonnegative(),
  openTickets: z.number().int().nonnegative(),
  slaCompliance: z.number().min(0).max(1),
  devicesOnline: z.number().int().nonnegative(), // ONU online
  devicesTotal: z.number().int().nonnegative(),
  revenueTrend: z.array(MonthRevenueSchema),
  ticketsByStatus: z.array(StatusCountSchema),
  // Short trend series powering KPI sparklines.
  subscriberTrend: z.array(z.number()),
  isolatedTrend: z.array(z.number()),
  arTrend: z.array(z.number()),
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

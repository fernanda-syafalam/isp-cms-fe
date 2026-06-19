import { api } from './client'
import {
  type DashboardSummary,
  DashboardSummarySchema,
  type ReportsSummary,
  ReportsSummarySchema,
} from '@/schemas/analytics'

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const json = await api.get('analytics/dashboard').json()
  return DashboardSummarySchema.parse(json)
}

// `months` slices the revenue/movement trend to the last N months (3/6/12).
export async function getReportsSummary(months?: number): Promise<ReportsSummary> {
  const searchParams = months ? { months: String(months) } : undefined
  const json = await api.get('analytics/reports', { searchParams }).json()
  return ReportsSummarySchema.parse(json)
}

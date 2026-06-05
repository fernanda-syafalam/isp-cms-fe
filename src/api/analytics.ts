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

export async function getReportsSummary(): Promise<ReportsSummary> {
  const json = await api.get('analytics/reports').json()
  return ReportsSummarySchema.parse(json)
}

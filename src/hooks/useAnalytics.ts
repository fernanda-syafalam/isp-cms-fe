import { useQuery } from '@tanstack/react-query'

import { getDashboardSummary, getReportsSummary } from '@/api/analytics'

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['analytics', 'dashboard'] as const,
    queryFn: getDashboardSummary,
  })
}

export function useReportsSummary() {
  return useQuery({
    queryKey: ['analytics', 'reports'] as const,
    queryFn: getReportsSummary,
  })
}

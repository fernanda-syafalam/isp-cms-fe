import { useQuery } from '@tanstack/react-query'

import { getDashboardSummary, getReportsSummary } from '@/api/analytics'

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['analytics', 'dashboard'] as const,
    queryFn: getDashboardSummary,
  })
}

export function useReportsSummary(months?: number) {
  return useQuery({
    queryKey: ['analytics', 'reports', months ?? 'all'] as const,
    queryFn: () => getReportsSummary(months),
  })
}

import { useQuery, useQueryClient } from '@tanstack/react-query'

import { USAGE_EXPORT_LIMIT, type UsageFilter, listUsage } from '@/api/usage'
import type { UsageList } from '@/schemas/usage'

export function useUsageList(filter: UsageFilter = {}) {
  return useQuery({
    queryKey: ['usage', 'list', filter] as const,
    queryFn: () => listUsage(filter),
  })
}

// Export the full filtered set (server pagination keeps only the page in the
// table) by fetching a single max-size page through the query cache.
export function useExportUsage() {
  const qc = useQueryClient()
  return (filter: UsageFilter): Promise<UsageList> => {
    const exportFilter: UsageFilter = {
      ...filter,
      limit: USAGE_EXPORT_LIMIT,
      offset: 0,
    }
    return qc.fetchQuery({
      queryKey: ['usage', 'list', exportFilter] as const,
      queryFn: () => listUsage(exportFilter),
    })
  }
}

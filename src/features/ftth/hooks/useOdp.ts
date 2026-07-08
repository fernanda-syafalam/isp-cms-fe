import { useQuery, useQueryClient } from '@tanstack/react-query'

import { ODP_EXPORT_LIMIT, type OdpFilter, listOdp } from '@/api/odp'
import { odpKeys } from '@/features/ftth/queries/keys'
import type { OdpList } from '@/schemas/odp'

export function useOdpList(filter: OdpFilter = {}) {
  return useQuery({
    queryKey: odpKeys.list(filter),
    queryFn: () => listOdp(filter),
  })
}

// Export the full filtered set (server pagination keeps only the page in the
// table) by fetching a single max-size page through the query cache.
export function useExportOdp() {
  const qc = useQueryClient()
  return (filter: OdpFilter): Promise<OdpList> => {
    const exportFilter: OdpFilter = {
      ...filter,
      limit: ODP_EXPORT_LIMIT,
      offset: 0,
    }
    return qc.fetchQuery({
      queryKey: odpKeys.list(exportFilter),
      queryFn: () => listOdp(exportFilter),
    })
  }
}

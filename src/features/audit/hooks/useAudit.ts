import { useQuery, useQueryClient } from '@tanstack/react-query'

import { AUDIT_EXPORT_LIMIT, type AuditFilter, listAudit } from '@/api/audit'

export function useAuditLog(filter: AuditFilter = {}) {
  return useQuery({
    queryKey: ['audit', 'list', filter] as const,
    queryFn: () => listAudit(filter),
  })
}

/**
 * Returns a callback that fetches the full filtered audit set (one max-size
 * page) for CSV export. With server pagination the table holds only the current
 * page, so export must re-query without the page window.
 */
export function useExportAudit() {
  const qc = useQueryClient()
  return (filter: AuditFilter = {}) => {
    const exportFilter: AuditFilter = {
      ...filter,
      limit: AUDIT_EXPORT_LIMIT,
      offset: 0,
    }
    return qc.fetchQuery({
      queryKey: ['audit', 'list', exportFilter] as const,
      queryFn: () => listAudit(exportFilter),
    })
  }
}

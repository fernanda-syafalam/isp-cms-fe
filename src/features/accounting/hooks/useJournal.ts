import { useQuery, useQueryClient } from '@tanstack/react-query'

import { ACCOUNTING_EXPORT_LIMIT, getJournal, type JournalFilter } from '@/api/accounting'
import type { Journal } from '@/schemas/accounting'

export function useJournal(period: string, filter: JournalFilter = {}) {
  return useQuery({
    queryKey: ['accounting', 'journal', period, filter] as const,
    queryFn: () => getJournal(period, filter),
  })
}

// Export the COMPLETE period journal (a GL export is imported wholesale into
// accounting software, so it ignores the table search) by fetching a single
// max-size page through the query cache.
export function useExportJournal() {
  const qc = useQueryClient()
  return (period: string): Promise<Journal> => {
    const exportFilter: JournalFilter = {
      limit: ACCOUNTING_EXPORT_LIMIT,
      offset: 0,
    }
    return qc.fetchQuery({
      queryKey: ['accounting', 'journal', period, exportFilter] as const,
      queryFn: () => getJournal(period, exportFilter),
    })
  }
}

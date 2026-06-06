import { useQuery } from '@tanstack/react-query'

import { getJournal } from '@/api/accounting'

export function useJournal(period: string) {
  return useQuery({
    queryKey: ['accounting', 'journal', period] as const,
    queryFn: () => getJournal(period),
  })
}

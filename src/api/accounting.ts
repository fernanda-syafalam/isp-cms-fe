import { api } from './client'
import { type Journal, JournalSchema } from '@/schemas/accounting'

export type JournalFilter = {
  q?: string | undefined
  sort?: string | undefined
  order?: 'asc' | 'desc' | undefined
  limit?: number | undefined
  offset?: number | undefined
}

// Backend caps a page at 200 rows; the CSV export pulls a single max-size page
// so it covers the full period journal without a paging loop.
export const ACCOUNTING_EXPORT_LIMIT = 200

export async function getJournal(period: string, filter: JournalFilter = {}): Promise<Journal> {
  const searchParams = new URLSearchParams({ period })
  if (filter.q) searchParams.set('q', filter.q)
  if (filter.sort) searchParams.set('sort', filter.sort)
  if (filter.order) searchParams.set('order', filter.order)
  if (filter.limit !== undefined) searchParams.set('limit', String(filter.limit))
  if (filter.offset !== undefined) searchParams.set('offset', String(filter.offset))
  const json = await api.get('accounting/journal', { searchParams }).json()
  return JournalSchema.parse(json)
}

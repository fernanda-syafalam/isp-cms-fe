import { api } from './client'
import { type CoverageList, CoverageListSchema } from '@/schemas/coverage'

export type CoverageFilter = {
  status?: string | undefined
  q?: string | undefined
  sort?: string | undefined
  order?: 'asc' | 'desc' | undefined
  limit?: number | undefined
  offset?: number | undefined
}

// Backend caps a page at 200 rows; the CSV export pulls a single max-size page
// so it covers the full filtered set without a paging loop.
export const COVERAGE_EXPORT_LIMIT = 200

export async function listCoverage(filter: CoverageFilter = {}): Promise<CoverageList> {
  const searchParams = new URLSearchParams()
  if (filter.status) searchParams.set('status', filter.status)
  if (filter.q) searchParams.set('q', filter.q)
  if (filter.sort) searchParams.set('sort', filter.sort)
  if (filter.order) searchParams.set('order', filter.order)
  if (filter.limit !== undefined) searchParams.set('limit', String(filter.limit))
  if (filter.offset !== undefined) searchParams.set('offset', String(filter.offset))
  const json = await api.get('coverage', { searchParams }).json()
  return CoverageListSchema.parse(json)
}

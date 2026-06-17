import { api } from './client'
import { type OdpList, OdpListSchema } from '@/schemas/odp'

// Capacity/health "views" the operator can filter the ODP list by. These are
// derived predicates (free ports / optical status), not a status equality, so
// the server owns them: available = has a free port, full = no free port,
// optical = optical status is not healthy.
export type OdpView = 'available' | 'full' | 'optical'

export type OdpFilter = {
  view?: OdpView | undefined
  q?: string | undefined
  sort?: string | undefined
  order?: 'asc' | 'desc' | undefined
  limit?: number | undefined
  offset?: number | undefined
}

// Backend caps a page at 200 rows; the CSV export pulls a single max-size page
// so it covers the full filtered set without a paging loop.
export const ODP_EXPORT_LIMIT = 200

export async function listOdp(filter: OdpFilter = {}): Promise<OdpList> {
  const searchParams = new URLSearchParams()
  if (filter.view) searchParams.set('view', filter.view)
  if (filter.q) searchParams.set('q', filter.q)
  if (filter.sort) searchParams.set('sort', filter.sort)
  if (filter.order) searchParams.set('order', filter.order)
  if (filter.limit !== undefined) searchParams.set('limit', String(filter.limit))
  if (filter.offset !== undefined) searchParams.set('offset', String(filter.offset))
  const json = await api.get('odp', { searchParams }).json()
  return OdpListSchema.parse(json)
}

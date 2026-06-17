import { api } from './client'
import { type AuditList, AuditListSchema } from '@/schemas/audit'

export type AuditFilter = {
  entityId?: string | undefined
  q?: string | undefined
  sort?: string | undefined
  order?: 'asc' | 'desc' | undefined
  limit?: number | undefined
  offset?: number | undefined
}

// Backend caps the audit page at 500 rows; the CSV export pulls a single
// max-size page so it covers the full filtered set without a paging loop.
export const AUDIT_EXPORT_LIMIT = 500

export async function listAudit(filter: AuditFilter = {}): Promise<AuditList> {
  const searchParams = new URLSearchParams()
  if (filter.entityId) searchParams.set('entityId', filter.entityId)
  if (filter.q) searchParams.set('q', filter.q)
  if (filter.sort) searchParams.set('sort', filter.sort)
  if (filter.order) searchParams.set('order', filter.order)
  if (filter.limit !== undefined) searchParams.set('limit', String(filter.limit))
  if (filter.offset !== undefined) searchParams.set('offset', String(filter.offset))
  const json = await api.get('audit', { searchParams }).json()
  return AuditListSchema.parse(json)
}

import { api } from './client'
import { type AuditList, AuditListSchema } from '@/schemas/audit'

export async function listAudit(filter: { entityId?: string } = {}): Promise<AuditList> {
  const json = await api
    .get('audit', filter.entityId ? { searchParams: { entityId: filter.entityId } } : undefined)
    .json()
  return AuditListSchema.parse(json)
}

import { api } from './client'
import { type AuditList, AuditListSchema } from '@/schemas/audit'

export async function listAudit(): Promise<AuditList> {
  const json = await api.get('audit').json()
  return AuditListSchema.parse(json)
}

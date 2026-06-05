import { api } from './client'
import { ResellerListSchema, type ResellerList } from '@/schemas/reseller'

export async function listResellers(): Promise<ResellerList> {
  const json = await api.get('resellers').json()
  return ResellerListSchema.parse(json)
}

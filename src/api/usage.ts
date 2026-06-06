import { api } from './client'
import { type UsageList, UsageListSchema } from '@/schemas/usage'

export async function listUsage(): Promise<UsageList> {
  const json = await api.get('usage').json()
  return UsageListSchema.parse(json)
}

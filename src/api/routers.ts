import { api } from './client'
import { RouterListSchema, type RouterList } from '@/schemas/router'

export async function listRouters(): Promise<RouterList> {
  const json = await api.get('routers').json()
  return RouterListSchema.parse(json)
}

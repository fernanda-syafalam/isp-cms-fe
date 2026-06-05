import { api } from './client'
import { CoverageListSchema, type CoverageList } from '@/schemas/coverage'

export async function listCoverage(): Promise<CoverageList> {
  const json = await api.get('coverage').json()
  return CoverageListSchema.parse(json)
}

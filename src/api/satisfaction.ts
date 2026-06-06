import { api } from './client'
import { type Satisfaction, SatisfactionSchema } from '@/schemas/satisfaction'

export async function getSatisfaction(): Promise<Satisfaction> {
  const json = await api.get('satisfaction').json()
  return SatisfactionSchema.parse(json)
}

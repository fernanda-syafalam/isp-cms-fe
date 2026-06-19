import { api } from './client'
import {
  type CreateSlaCreditInput,
  type SlaCredit,
  type SlaCreditList,
  SlaCreditListSchema,
  SlaCreditSchema,
} from '@/schemas/slaCredit'

export type SlaCreditFilter = {
  status?: string | undefined
  q?: string | undefined
  sort?: string | undefined
  order?: 'asc' | 'desc' | undefined
  limit?: number | undefined
  offset?: number | undefined
}

export async function listSlaCredits(filter: SlaCreditFilter = {}): Promise<SlaCreditList> {
  const searchParams = new URLSearchParams()
  if (filter.status) searchParams.set('status', filter.status)
  if (filter.q) searchParams.set('q', filter.q)
  if (filter.sort) searchParams.set('sort', filter.sort)
  if (filter.order) searchParams.set('order', filter.order)
  if (filter.limit !== undefined) searchParams.set('limit', String(filter.limit))
  if (filter.offset !== undefined) searchParams.set('offset', String(filter.offset))
  const json = await api.get('sla-credits', { searchParams }).json()
  return SlaCreditListSchema.parse(json)
}

export async function createSlaCredit(input: CreateSlaCreditInput): Promise<SlaCredit> {
  const json = await api.post('sla-credits', { json: input }).json()
  return SlaCreditSchema.parse(json)
}

// Apply the credit to the subscriber's next invoice (mock: marks applied).
export async function applySlaCredit(id: string): Promise<SlaCredit> {
  const json = await api.post(`sla-credits/${id}/apply`).json()
  return SlaCreditSchema.parse(json)
}

export async function voidSlaCredit(id: string): Promise<SlaCredit> {
  const json = await api.post(`sla-credits/${id}/void`).json()
  return SlaCreditSchema.parse(json)
}

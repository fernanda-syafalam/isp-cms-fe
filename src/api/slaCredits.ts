import { api } from './client'
import {
  type CreateSlaCreditInput,
  type SlaCredit,
  type SlaCreditList,
  SlaCreditListSchema,
  SlaCreditSchema,
} from '@/schemas/slaCredit'

export async function listSlaCredits(): Promise<SlaCreditList> {
  const json = await api.get('sla-credits').json()
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

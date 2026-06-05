import { api } from './client'
import {
  type Reseller,
  ResellerListSchema,
  ResellerSchema,
  type ResellerList,
  type UpdateResellerInput,
} from '@/schemas/reseller'

export async function listResellers(): Promise<ResellerList> {
  const json = await api.get('resellers').json()
  return ResellerListSchema.parse(json)
}

// Edit reseller, or deactivate (soft-delete) by sending { status: 'inactive' }.
export async function updateReseller(id: string, input: UpdateResellerInput): Promise<Reseller> {
  const json = await api.patch(`resellers/${id}`, { json: input }).json()
  return ResellerSchema.parse(json)
}

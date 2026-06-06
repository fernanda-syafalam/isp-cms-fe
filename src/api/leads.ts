import { api } from './client'
import {
  type CreateLeadInput,
  type Lead,
  type LeadList,
  LeadListSchema,
  LeadSchema,
  type LeadStage,
} from '@/schemas/lead'

export async function listLeads(): Promise<LeadList> {
  const json = await api.get('leads').json()
  return LeadListSchema.parse(json)
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const json = await api.post('leads', { json: input }).json()
  return LeadSchema.parse(json)
}

export async function updateLeadStage(id: string, stage: LeadStage): Promise<Lead> {
  const json = await api.patch(`leads/${id}/stage`, { json: { stage } }).json()
  return LeadSchema.parse(json)
}

// Convert a won lead into a real subscriber (onboarding hand-off).
export async function convertLead(id: string): Promise<Lead> {
  const json = await api.post(`leads/${id}/convert`).json()
  return LeadSchema.parse(json)
}

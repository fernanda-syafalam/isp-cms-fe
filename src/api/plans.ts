import { api } from './client'
import {
  type CreatePlanInput,
  type Plan,
  PlanListSchema,
  PlanSchema,
  type PlanList,
} from '@/schemas/plan'

export async function listPlans(): Promise<PlanList> {
  const json = await api.get('plans').json()
  return PlanListSchema.parse(json)
}

export async function createPlan(input: CreatePlanInput): Promise<Plan> {
  const json = await api.post('plans', { json: input }).json()
  return PlanSchema.parse(json)
}

export async function updatePlan(id: string, input: CreatePlanInput): Promise<Plan> {
  const json = await api.patch(`plans/${id}`, { json: input }).json()
  return PlanSchema.parse(json)
}

// Soft-delete: archive the plan (status → archived).
export async function archivePlan(id: string): Promise<Plan> {
  const json = await api.post(`plans/${id}/archive`).json()
  return PlanSchema.parse(json)
}

import { api } from './client'
import {
  type CreatePlanInput,
  type Plan,
  PlanListSchema,
  PlanSchema,
  type PlanList,
} from '@/schemas/plan'

export type PlanFilter = {
  status?: string | undefined
  q?: string | undefined
  sort?: string | undefined
  order?: 'asc' | 'desc' | undefined
  limit?: number | undefined
  offset?: number | undefined
}

// Backend caps a page at 200 rows; the CSV export pulls a single max-size page
// so it covers the full filtered set without a paging loop.
export const PLAN_EXPORT_LIMIT = 200

export async function listPlans(filter: PlanFilter = {}): Promise<PlanList> {
  const searchParams = new URLSearchParams()
  if (filter.status) searchParams.set('status', filter.status)
  if (filter.q) searchParams.set('q', filter.q)
  if (filter.sort) searchParams.set('sort', filter.sort)
  if (filter.order) searchParams.set('order', filter.order)
  if (filter.limit !== undefined) searchParams.set('limit', String(filter.limit))
  if (filter.offset !== undefined) searchParams.set('offset', String(filter.offset))
  const json = await api.get('plans', { searchParams }).json()
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

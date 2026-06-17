import { api } from './client'
import {
  type Branch,
  type BranchList,
  BranchListSchema,
  BranchSchema,
  type CreateBranchInput,
  type UpdateBranchInput,
} from '@/schemas/branch'

export type BranchFilter = {
  q?: string | undefined
  sort?: string | undefined
  order?: 'asc' | 'desc' | undefined
  limit?: number | undefined
  offset?: number | undefined
}

export async function listBranches(filter: BranchFilter = {}): Promise<BranchList> {
  const searchParams = new URLSearchParams()
  if (filter.q) searchParams.set('q', filter.q)
  if (filter.sort) searchParams.set('sort', filter.sort)
  if (filter.order) searchParams.set('order', filter.order)
  if (filter.limit !== undefined) searchParams.set('limit', String(filter.limit))
  if (filter.offset !== undefined) searchParams.set('offset', String(filter.offset))
  const json = await api.get('branches', { searchParams }).json()
  return BranchListSchema.parse(json)
}

export async function createBranch(input: CreateBranchInput): Promise<Branch> {
  const json = await api.post('branches', { json: input }).json()
  return BranchSchema.parse(json)
}

export async function updateBranch(id: string, input: UpdateBranchInput): Promise<Branch> {
  const json = await api.patch(`branches/${id}`, { json: input }).json()
  return BranchSchema.parse(json)
}

import { api } from './client'
import {
  type Branch,
  type BranchList,
  BranchListSchema,
  BranchSchema,
  type CreateBranchInput,
  type UpdateBranchInput,
} from '@/schemas/branch'

export async function listBranches(): Promise<BranchList> {
  const json = await api.get('branches').json()
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

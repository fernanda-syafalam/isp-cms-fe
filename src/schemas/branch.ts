import { z } from 'zod'

// Branch / cabang (POP) — the unit of multi-branch scoping (mock).
export const BranchStatusSchema = z.enum(['active', 'inactive'])

export const BranchSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  manager: z.string(),
  phone: z.string(),
  status: BranchStatusSchema,
  isHeadOffice: z.boolean(),
  customerCount: z.number().int().nonnegative(),
  mrr: z.number().int().nonnegative(), // monthly recurring revenue (IDR)
  deviceCount: z.number().int().nonnegative(),
})

export const BranchListSchema = z.object({
  items: z.array(BranchSchema),
  total: z.number().int().nonnegative(),
})

export const CreateBranchSchema = z.object({
  name: z.string().min(1, 'Nama cabang wajib diisi').max(120),
  city: z.string().min(1, 'Kota wajib diisi').max(80),
  manager: z.string().min(1, 'Penanggung jawab wajib diisi').max(120),
  phone: z.string().min(1, 'Telepon wajib diisi').max(20),
})

export type BranchStatus = z.infer<typeof BranchStatusSchema>
export type Branch = z.infer<typeof BranchSchema>
export type BranchList = z.infer<typeof BranchListSchema>
export type CreateBranchInput = z.infer<typeof CreateBranchSchema>

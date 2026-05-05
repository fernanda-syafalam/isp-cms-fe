import { z } from 'zod'

import { tenantId } from '@/types/ids'

export const TenantSchema = z.object({
  id: tenantId,
  name: z.string().min(1).max(100),
  email: z.email(),
  status: z.enum(['active', 'suspended', 'pending']),
  createdAt: z.iso.datetime(),
})

export const TenantListSchema = z.object({
  items: z.array(TenantSchema),
  total: z.number().int().nonnegative(),
})

export const TenantFilterSchema = z.object({
  q: z.string().optional(),
  status: z.enum(['active', 'suspended', 'pending']).optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  // Server-side sort. Client-side sort within a page is also supported via
  // TanStack Table; for true cross-page sort, pass these to the API instead.
  sortBy: z.enum(['name', 'email', 'status', 'createdAt']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
})

export const CreateTenantSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.email('Invalid email'),
})

export type Tenant = z.infer<typeof TenantSchema>
export type TenantList = z.infer<typeof TenantListSchema>
export type TenantFilter = z.infer<typeof TenantFilterSchema>
export type CreateTenantInput = z.infer<typeof CreateTenantSchema>

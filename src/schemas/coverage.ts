import { z } from 'zod'

import { areaId } from '@/types/ids'

export const CoverageTypeSchema = z.enum(['pop', 'area'])
export const CoverageStatusSchema = z.enum(['operational', 'maintenance', 'down'])

export const CoverageSchema = z.object({
  id: areaId,
  name: z.string().min(1),
  type: CoverageTypeSchema,
  region: z.string(),
  capacity: z.number().int().nonnegative(),
  activeConnections: z.number().int().nonnegative(),
  status: CoverageStatusSchema,
})

export const CoverageListSchema = z.object({
  items: z.array(CoverageSchema),
  total: z.number().int().nonnegative(),
})

export type CoverageType = z.infer<typeof CoverageTypeSchema>
export type CoverageStatus = z.infer<typeof CoverageStatusSchema>
export type Coverage = z.infer<typeof CoverageSchema>
export type CoverageList = z.infer<typeof CoverageListSchema>

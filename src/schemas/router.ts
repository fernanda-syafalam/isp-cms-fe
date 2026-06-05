import { z } from 'zod'

import { routerId } from '@/types/ids'

// Mikrotik NAS managed by the centralized RADIUS ("one app, many Mikrotik").
export const RouterStatusSchema = z.enum(['online', 'offline'])

export const RouterSchema = z.object({
  id: routerId,
  name: z.string().min(1),
  address: z.string(), // management IP
  model: z.string(),
  status: RouterStatusSchema,
  secretCount: z.number().int().nonnegative(), // active PPPoE secrets
  lastSyncAt: z.iso.datetime(),
})

export const RouterListSchema = z.object({
  items: z.array(RouterSchema),
  total: z.number().int().nonnegative(),
})

export type RouterStatus = z.infer<typeof RouterStatusSchema>
export type Router = z.infer<typeof RouterSchema>
export type RouterList = z.infer<typeof RouterListSchema>

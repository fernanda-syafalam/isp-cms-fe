import { z } from 'zod'

import { routerId } from '@/types/ids'

// Mikrotik NAS managed by the centralized RADIUS ("one app, many Mikrotik").
export const RouterStatusSchema = z.enum(['online', 'offline'])

export const RouterSchema = z.object({
  id: routerId,
  name: z.string().min(1),
  address: z.string(), // management host / IP
  apiPort: z.number().int().positive(), // RouterOS API port (8728, or 8729 TLS)
  username: z.string(), // API user
  model: z.string(), // RouterOS board-name
  version: z.string(), // RouterOS version
  status: RouterStatusSchema,
  secretCount: z.number().int().nonnegative(), // active PPPoE secrets
  lastSyncAt: z.iso.datetime(),
})

// Full-set counts over ALL routers (ignores the status filter) — drives the
// KPI cards and the status filter tabs.
export const RouterSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  byStatus: z.object({
    online: z.number().int().nonnegative(),
    offline: z.number().int().nonnegative(),
  }),
})

export const RouterListSchema = z.object({
  items: z.array(RouterSchema),
  total: z.number().int().nonnegative(),
  summary: RouterSummarySchema,
})

// Connect a new RouterOS device: API host/port + credentials.
export const ConnectRouterSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(80),
  host: z.string().min(1, 'Host / IP wajib diisi').max(120),
  apiPort: z.number().int().min(1).max(65535),
  username: z.string().min(1, 'Username wajib diisi').max(60),
  password: z.string().min(1, 'Password wajib diisi').max(120),
  useTls: z.boolean(),
})

// Result of probing a RouterOS device before saving it.
export const TestConnectionResultSchema = z.object({
  ok: z.boolean(),
  identity: z.string().nullable(),
  model: z.string().nullable(),
  version: z.string().nullable(),
  message: z.string().nullable(),
})

export type RouterStatus = z.infer<typeof RouterStatusSchema>
export type Router = z.infer<typeof RouterSchema>
export type RouterList = z.infer<typeof RouterListSchema>
export type ConnectRouterInput = z.infer<typeof ConnectRouterSchema>
export type TestConnectionResult = z.infer<typeof TestConnectionResultSchema>

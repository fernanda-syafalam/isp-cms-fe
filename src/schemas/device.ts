import { z } from 'zod'

import { deviceId } from '@/types/ids'

export const DeviceTypeSchema = z.enum(['olt', 'onu', 'mikrotik'])
export const DeviceStatusSchema = z.enum(['online', 'degraded', 'offline'])

export const DeviceSchema = z.object({
  id: deviceId,
  name: z.string().min(1),
  type: DeviceTypeSchema,
  ipAddress: z.string(),
  status: DeviceStatusSchema,
  uptimeHours: z.number().nonnegative(),
  areaName: z.string(),
  lastSeenAt: z.iso.datetime(),
})

export const DeviceListSchema = z.object({
  items: z.array(DeviceSchema),
  total: z.number().int().nonnegative(),
})

export type DeviceType = z.infer<typeof DeviceTypeSchema>
export type DeviceStatus = z.infer<typeof DeviceStatusSchema>
export type Device = z.infer<typeof DeviceSchema>
export type DeviceList = z.infer<typeof DeviceListSchema>

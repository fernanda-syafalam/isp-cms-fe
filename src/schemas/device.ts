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
  rxPower: z.number().nullable(), // optical RX power in dBm (ONU only)
  areaName: z.string(),
  lastSeenAt: z.iso.datetime(),
  topologyNodeId: z.string().nullable(), // matching topology node (OLT), if any
  // Recent RX-power readings (dBm), newest last — populated on the detail
  // endpoint to power the optical-health trend sparkline. Omitted on the list.
  signalTrend: z.array(z.number()).optional(),
})

// Full-set counts over ALL devices (ignores type/status filters) — drives the
// KPI cards and the status filter tabs.
export const DeviceSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  byStatus: z.object({
    online: z.number().int().nonnegative(),
    degraded: z.number().int().nonnegative(),
    offline: z.number().int().nonnegative(),
  }),
})

export const DeviceListSchema = z.object({
  items: z.array(DeviceSchema),
  total: z.number().int().nonnegative(),
  summary: DeviceSummarySchema,
})

export const UpdateDeviceSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(120).optional(),
  ipAddress: z.string().min(1, 'IP wajib diisi').max(60).optional(),
  areaName: z.string().min(1, 'Area wajib diisi').max(120).optional(),
})

export type DeviceSummary = z.infer<typeof DeviceSummarySchema>
export type DeviceType = z.infer<typeof DeviceTypeSchema>
export type DeviceStatus = z.infer<typeof DeviceStatusSchema>
export type Device = z.infer<typeof DeviceSchema>
export type UpdateDeviceInput = z.infer<typeof UpdateDeviceSchema>
export type DeviceList = z.infer<typeof DeviceListSchema>

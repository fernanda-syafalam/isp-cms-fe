import { z } from 'zod'

// CPE/ONU managed via TR-069 ACS (GenieACS). Mock-first, contract-ready.
export const AcsStatusSchema = z.enum(['online', 'offline'])

export const AcsDeviceSchema = z.object({
  id: z.string(),
  serial: z.string(),
  customerName: z.string(),
  model: z.string(),
  firmware: z.string(),
  rxPowerDbm: z.number().nullable(),
  status: AcsStatusSchema,
  lastInform: z.iso.datetime(),
})

// Full-set counts over ALL CPE (ignores the status filter) — drives the KPI
// cards and the status filter tabs.
export const AcsSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  byStatus: z.object({
    online: z.number().int().nonnegative(),
    offline: z.number().int().nonnegative(),
  }),
})

export const AcsDeviceListSchema = z.object({
  items: z.array(AcsDeviceSchema),
  total: z.number().int().nonnegative(),
  summary: AcsSummarySchema,
})

export const AcsActionSchema = z.enum(['reboot', 'firmware', 'wifi'])

// Bulk TR-069 task over selected devices. firmwareVersion for 'firmware';
// ssid/password for 'wifi'.
export const BulkAcsSchema = z.object({
  action: AcsActionSchema,
  deviceIds: z.array(z.string()).min(1, 'Pilih minimal 1 perangkat'),
  firmwareVersion: z.string().optional(),
  ssid: z.string().optional(),
  password: z.string().optional(),
})

export const BulkAcsResultSchema = z.object({
  affected: z.number().int().nonnegative(),
})

export type AcsStatus = z.infer<typeof AcsStatusSchema>
export type AcsSummary = z.infer<typeof AcsSummarySchema>
export type AcsDevice = z.infer<typeof AcsDeviceSchema>
export type AcsDeviceList = z.infer<typeof AcsDeviceListSchema>
export type AcsAction = z.infer<typeof AcsActionSchema>
export type BulkAcsInput = z.infer<typeof BulkAcsSchema>
export type BulkAcsResult = z.infer<typeof BulkAcsResultSchema>

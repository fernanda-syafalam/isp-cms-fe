import { z } from 'zod'

// FTTH distribution point (ODP) capacity + optical health (mock-first).
export const OdpStatusSchema = z.enum(['healthy', 'warning', 'critical'])

export const OdpRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  area: z.string(),
  splitter: z.string(), // e.g. "1:8", "1:16"
  totalPorts: z.number().int().positive(),
  usedPorts: z.number().int().nonnegative(),
  avgRxPowerDbm: z.number(), // optical RX power, dBm (negative)
  status: OdpStatusSchema,
})

export const OdpListSchema = z.object({
  items: z.array(OdpRecordSchema),
  total: z.number().int().nonnegative(),
})

export type OdpStatus = z.infer<typeof OdpStatusSchema>
export type OdpRecord = z.infer<typeof OdpRecordSchema>
export type OdpList = z.infer<typeof OdpListSchema>

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

// Full-set aggregate for the KPI cards. Computed server-side over every ODP
// (ignores view/q/sort/paging) so the cards stay correct under any table filter.
export const OdpSummarySchema = z.object({
  totalOdp: z.number().int().nonnegative(), // count of all ODP
  utilization: z.number().int().nonnegative(), // used/total ports across the fleet, %
  full: z.number().int().nonnegative(), // count of ODP with no free port
  optical: z.number().int().nonnegative(), // count of ODP with status != healthy
})

export const OdpListSchema = z.object({
  items: z.array(OdpRecordSchema),
  total: z.number().int().nonnegative(),
  summary: OdpSummarySchema,
})

export type OdpStatus = z.infer<typeof OdpStatusSchema>
export type OdpRecord = z.infer<typeof OdpRecordSchema>
export type OdpSummary = z.infer<typeof OdpSummarySchema>
export type OdpList = z.infer<typeof OdpListSchema>

import { z } from 'zod'

// Live-ish device telemetry for the NOC (mock; a real backend polls SNMP/ping).
export const MetricStatusSchema = z.enum(['up', 'degraded', 'down'])

export const DeviceMetricSchema = z.object({
  deviceId: z.string(),
  name: z.string(),
  type: z.string(),
  areaName: z.string(),
  status: MetricStatusSchema,
  uptimePct: z.number(), // rolling availability %
  latencyMs: z.number().int().nonnegative(),
  utilizationPct: z.number().int().nonnegative(), // link utilization
})

// Fleet-health aggregate computed over the FULL device set (ignores q/sort/
// paging) so the NOC KPI cards + overall status badge stay correct under any
// table filter.
export const DeviceMetricSummarySchema = z.object({
  up: z.number().int().nonnegative(),
  degraded: z.number().int().nonnegative(),
  down: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  avgUptimePct: z.number().nonnegative(),
})

export const DeviceMetricListSchema = z.object({
  items: z.array(DeviceMetricSchema),
  total: z.number().int().nonnegative(),
  summary: DeviceMetricSummarySchema,
})

export const AlertSeveritySchema = z.enum(['warning', 'critical'])

export const AlertSchema = z.object({
  id: z.string(),
  deviceId: z.string(),
  deviceName: z.string(),
  severity: AlertSeveritySchema,
  message: z.string(),
  at: z.iso.datetime(),
  acknowledged: z.boolean(),
})

export const AlertListSchema = z.object({
  items: z.array(AlertSchema),
  total: z.number().int().nonnegative(),
})

export type MetricStatus = z.infer<typeof MetricStatusSchema>
export type DeviceMetric = z.infer<typeof DeviceMetricSchema>
export type DeviceMetricSummary = z.infer<typeof DeviceMetricSummarySchema>
export type DeviceMetricList = z.infer<typeof DeviceMetricListSchema>
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>
export type Alert = z.infer<typeof AlertSchema>
export type AlertList = z.infer<typeof AlertListSchema>

import { z } from 'zod'

import { workOrderId } from '@/types/ids'

export const WorkOrderTypeSchema = z.enum(['install', 'repair', 'dismantle'])
export const WorkOrderStatusSchema = z.enum(['scheduled', 'in_progress', 'done', 'cancelled'])

export const WorkOrderSchema = z.object({
  id: workOrderId,
  code: z.string(),
  type: WorkOrderTypeSchema,
  customerId: z.string().nullable(), // resolves to the subscriber record, if any
  customerName: z.string(),
  technician: z.string().nullable(),
  scheduledAt: z.iso.datetime(),
  status: WorkOrderStatusSchema,
  createdAt: z.iso.datetime(),
})

// Full-set counts over ALL work orders (ignores status/type filters) — drives
// the KPI cards and the status filter tabs.
export const WorkOrderSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  byStatus: z.object({
    scheduled: z.number().int().nonnegative(),
    in_progress: z.number().int().nonnegative(),
    done: z.number().int().nonnegative(),
    cancelled: z.number().int().nonnegative(),
  }),
})

export const WorkOrderListSchema = z.object({
  items: z.array(WorkOrderSchema),
  total: z.number().int().nonnegative(),
  summary: WorkOrderSummarySchema,
})

export type WorkOrderType = z.infer<typeof WorkOrderTypeSchema>
export type WorkOrderStatus = z.infer<typeof WorkOrderStatusSchema>
export type WorkOrder = z.infer<typeof WorkOrderSchema>
export type WorkOrderSummary = z.infer<typeof WorkOrderSummarySchema>
export type WorkOrderList = z.infer<typeof WorkOrderListSchema>

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
  // The ticket that spawned this repair WO, if any (P3.B.4). Completing the WO
  // auto-resolves this ticket.
  ticketId: z.string().nullable(),
  createdAt: z.iso.datetime(),
  // Field-completion evidence captured when the WO is completed (P3.B.3). All
  // null until the technician completes the order with a completion body.
  scannedOnuSerial: z.string().nullable(),
  measuredRxPower: z.number().nullable(),
  photos: z.array(z.string()).nullable(),
  signatureUrl: z.string().nullable(),
  gpsLat: z.number().nullable(),
  gpsLng: z.number().nullable(),
  // Free-text field notes the technician enters on completion ("Catatan").
  // Only present on a completed WO; optional so a non-completed WO still parses.
  completionNotes: z.string().nullable().optional(),
  completedAt: z.iso.datetime().nullable(),
  completedBy: z.string().nullable(),
})

// Request body for POST /work-orders/:id/complete (P3.B.3). Every field is
// optional so a quick one-click completion still works with an empty body.
export const CompleteWorkOrderInputSchema = z.object({
  onuSerial: z.string().min(1, 'Serial ONU tidak boleh kosong').max(64).optional(),
  rxPower: z.number().optional(),
  photos: z.array(z.url('URL foto tidak valid')).max(10, 'Maksimal 10 foto').optional(),
  signatureUrl: z.url('URL tanda tangan tidak valid').optional(),
  gps: z.object({ lat: z.number(), lng: z.number() }).optional(),
  technician: z.string().optional(),
  notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional(),
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
export type CompleteWorkOrderInput = z.infer<typeof CompleteWorkOrderInputSchema>

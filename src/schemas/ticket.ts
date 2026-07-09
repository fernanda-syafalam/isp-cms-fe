import { z } from 'zod'

import { ticketId } from '@/types/ids'

export const TicketStatusSchema = z.enum(['open', 'in_progress', 'resolved', 'breached'])
export const TicketPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent'])

// Customer-facing issue category (portal ticket depth, P3.C.2). The enum values
// stay English; the display labels are translated at the render boundary.
export const TicketCategorySchema = z.enum([
  'koneksi_putus',
  'lambat',
  'tagihan',
  'perangkat',
  'lainnya',
])

export const TicketSchema = z.object({
  id: ticketId,
  code: z.string(),
  subject: z.string().min(1),
  customerId: z.string().nullable(), // resolves to the subscriber, if any
  customerName: z.string(),
  priority: TicketPrioritySchema,
  status: TicketStatusSchema,
  assignee: z.string().nullable(),
  slaDueAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  // Portal ticket depth + CSAT (P3.C.2). All optional/nullable so legacy rows
  // and staff-created tickets (no category/photo/rating) still parse.
  category: TicketCategorySchema.nullish(),
  photoUrl: z.string().nullish(),
  csatRating: z.number().int().min(1).max(5).nullish(),
  csatComment: z.string().nullish(),
  csatAt: z.iso.datetime().nullish(),
})

// Full-set counts over ALL tickets (ignores the status filter) — drives the
// KPI cards and the status filter tabs.
export const TicketSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  byStatus: z.object({
    open: z.number().int().nonnegative(),
    in_progress: z.number().int().nonnegative(),
    resolved: z.number().int().nonnegative(),
    breached: z.number().int().nonnegative(),
  }),
})

export const TicketListSchema = z.object({
  items: z.array(TicketSchema),
  total: z.number().int().nonnegative(),
  summary: TicketSummarySchema,
})

export const CreateTicketSchema = z.object({
  subject: z.string().min(1, 'Subjek wajib diisi').max(160),
  customerName: z.string().min(1, 'Pelanggan wajib dipilih').max(120),
  priority: TicketPrioritySchema,
})

export const UpdateTicketSchema = z.object({
  subject: z.string().min(1, 'Subjek wajib diisi').max(160).optional(),
  priority: TicketPrioritySchema.optional(),
  status: TicketStatusSchema.optional(),
  assignee: z.string().nullable().optional(),
})

export const TicketEventKindSchema = z.enum([
  'created',
  'comment',
  'status',
  'assign',
  'workorder',
  'csat',
])

export const TicketEventSchema = z.object({
  id: z.string(),
  ticketId: z.string(),
  kind: TicketEventKindSchema,
  author: z.string(),
  body: z.string(),
  at: z.iso.datetime(),
})

export const TicketEventListSchema = z.object({
  items: z.array(TicketEventSchema),
  total: z.number().int().nonnegative(),
})

export const AddCommentSchema = z.object({
  body: z.string().min(1, 'Komentar wajib diisi').max(500),
})

// Customer satisfaction rating on a resolved/breached ticket (P3.C.2).
export const SubmitCsatSchema = z.object({
  rating: z.number().int().min(1, 'Pilih rating 1-5').max(5),
  comment: z.string().max(500, 'Komentar maksimal 500 karakter').optional(),
})

// GET /v1/portal/tickets/:id → the ticket plus its full activity timeline.
export const PortalTicketDetailSchema = TicketSchema.extend({
  events: z.array(TicketEventSchema),
})

export type TicketStatus = z.infer<typeof TicketStatusSchema>
export type TicketPriority = z.infer<typeof TicketPrioritySchema>
export type TicketEvent = z.infer<typeof TicketEventSchema>
export type TicketEventList = z.infer<typeof TicketEventListSchema>
export type AddCommentInput = z.infer<typeof AddCommentSchema>
export type Ticket = z.infer<typeof TicketSchema>
export type TicketSummary = z.infer<typeof TicketSummarySchema>
export type TicketList = z.infer<typeof TicketListSchema>
export type CreateTicketInput = z.infer<typeof CreateTicketSchema>
export type UpdateTicketInput = z.infer<typeof UpdateTicketSchema>
export type TicketCategory = z.infer<typeof TicketCategorySchema>
export type TicketEventKind = z.infer<typeof TicketEventKindSchema>
export type SubmitCsatInput = z.infer<typeof SubmitCsatSchema>
export type PortalTicketDetail = z.infer<typeof PortalTicketDetailSchema>

import { z } from 'zod'

import { ticketId } from '@/types/ids'

export const TicketStatusSchema = z.enum(['open', 'in_progress', 'resolved', 'breached'])
export const TicketPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent'])

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
  subject: z.string().min(1, 'Subject is required').max(160),
  customerName: z.string().min(1, 'Customer is required').max(120),
  priority: TicketPrioritySchema,
})

export const UpdateTicketSchema = z.object({
  subject: z.string().min(1, 'Subjek wajib diisi').max(160).optional(),
  priority: TicketPrioritySchema.optional(),
  status: TicketStatusSchema.optional(),
  assignee: z.string().nullable().optional(),
})

export const TicketEventKindSchema = z.enum(['created', 'comment', 'status', 'assign', 'workorder'])

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

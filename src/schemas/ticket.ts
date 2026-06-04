import { z } from 'zod'

import { ticketId } from '@/types/ids'

export const TicketStatusSchema = z.enum(['open', 'in_progress', 'resolved', 'breached'])
export const TicketPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent'])

export const TicketSchema = z.object({
  id: ticketId,
  code: z.string(),
  subject: z.string().min(1),
  customerName: z.string(),
  priority: TicketPrioritySchema,
  status: TicketStatusSchema,
  assignee: z.string().nullable(),
  slaDueAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
})

export const TicketListSchema = z.object({
  items: z.array(TicketSchema),
  total: z.number().int().nonnegative(),
})

export const CreateTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(160),
  customerName: z.string().min(1, 'Customer is required').max(120),
  priority: TicketPrioritySchema,
})

export type TicketStatus = z.infer<typeof TicketStatusSchema>
export type TicketPriority = z.infer<typeof TicketPrioritySchema>
export type Ticket = z.infer<typeof TicketSchema>
export type TicketList = z.infer<typeof TicketListSchema>
export type CreateTicketInput = z.infer<typeof CreateTicketSchema>

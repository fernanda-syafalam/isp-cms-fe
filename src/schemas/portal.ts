import { z } from 'zod'

import { CustomerSchema } from './customer'
import { InvoiceSchema } from './invoice'
import { PaymentIntentSchema, PaymentSchema } from './payment'
import { TicketCategorySchema, TicketSchema } from './ticket'

// Self-service "me" snapshot for the customer portal. A real backend resolves
// the customer from their auth token; the mock returns a representative one.
export const PortalMeSchema = z.object({
  customer: CustomerSchema,
  invoices: z.array(InvoiceSchema),
  payments: z.array(PaymentSchema),
  tickets: z.array(TicketSchema),
  // Still-pending (unpaid, non-expired) QRIS/VA intents the customer already
  // started — lets the portal resume an unfinished payment (ADR-0011 parity).
  pendingIntents: z.array(PaymentIntentSchema),
})

export const ReportIssueSchema = z.object({
  subject: z.string().min(5, 'Jelaskan keluhan minimal 5 karakter').max(200),
  // Category is now REQUIRED by the backend (P3.C.2).
  category: TicketCategorySchema,
  // Optional evidence photo. An empty string is accepted from the form and
  // dropped before the request is sent (the backend wants a valid URL or none).
  photoUrl: z.union([z.string().url('Tautan foto tidak valid'), z.literal('')]).optional(),
})

export type PortalMe = z.infer<typeof PortalMeSchema>
export type ReportIssueInput = z.infer<typeof ReportIssueSchema>

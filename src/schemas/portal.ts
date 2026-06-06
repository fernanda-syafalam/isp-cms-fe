import { z } from 'zod'

import { CustomerSchema } from './customer'
import { InvoiceSchema } from './invoice'
import { PaymentSchema } from './payment'
import { TicketSchema } from './ticket'

// Self-service "me" snapshot for the customer portal. A real backend resolves
// the customer from their auth token; the mock returns a representative one.
export const PortalMeSchema = z.object({
  customer: CustomerSchema,
  invoices: z.array(InvoiceSchema),
  payments: z.array(PaymentSchema),
  tickets: z.array(TicketSchema),
})

export const ReportIssueSchema = z.object({
  subject: z.string().min(5, 'Jelaskan keluhan minimal 5 karakter').max(200),
})

export type PortalMe = z.infer<typeof PortalMeSchema>
export type ReportIssueInput = z.infer<typeof ReportIssueSchema>

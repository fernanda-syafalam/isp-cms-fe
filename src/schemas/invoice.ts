import { z } from 'zod'

import { customerId, invoiceId } from '@/types/ids'

export const InvoiceStatusSchema = z.enum(['paid', 'pending', 'overdue', 'draft'])

export const InvoiceSchema = z.object({
  id: invoiceId,
  invoiceNo: z.string(),
  customerId: customerId,
  customerName: z.string(),
  periodStart: z.iso.date(),
  periodEnd: z.iso.date(),
  amount: z.number().int().nonnegative(),
  lateFee: z.number().int().nonnegative(), // denda keterlambatan
  status: InvoiceStatusSchema,
  dueDate: z.iso.date(),
  paidAt: z.iso.datetime().nullable(),
})

export const InvoiceListSchema = z.object({
  items: z.array(InvoiceSchema),
  total: z.number().int().nonnegative(),
})

export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>
export type Invoice = z.infer<typeof InvoiceSchema>
export type InvoiceList = z.infer<typeof InvoiceListSchema>

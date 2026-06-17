import { z } from 'zod'

// SLA compensation credit issued to a subscriber (mock). pending → applied
// (deducted from the next invoice) | void.
export const SlaCreditStatusSchema = z.enum(['pending', 'applied', 'void'])

export const SlaCreditSchema = z.object({
  id: z.string(),
  customerId: z.string().nullable(),
  customerName: z.string(),
  amount: z.number().int().nonnegative(), // IDR
  reason: z.string(),
  ticketId: z.string().nullable(),
  ticketCode: z.string().nullable(),
  status: SlaCreditStatusSchema,
  createdAt: z.iso.datetime(),
  appliedAt: z.iso.datetime().nullable(),
})

// Full-set aggregate for the KPI cards. Computed server-side over every credit
// (ignores q/sort/paging) so the cards stay correct under any table filter.
export const SlaCreditSummarySchema = z.object({
  activeAmount: z.number().int().nonnegative(), // sum of amount over non-void credits
  pending: z.number().int().nonnegative(), // count of pending credits
  applied: z.number().int().nonnegative(), // count of applied credits
})

export const SlaCreditListSchema = z.object({
  items: z.array(SlaCreditSchema),
  total: z.number().int().nonnegative(),
  summary: SlaCreditSummarySchema,
})

export const CreateSlaCreditSchema = z.object({
  customerName: z.string().min(1, 'Pelanggan wajib diisi').max(120),
  amount: z.number().int().positive('Nominal harus > 0'),
  reason: z.string().min(1, 'Alasan wajib diisi').max(200),
  ticketCode: z.string().max(40).optional(),
})

export type SlaCreditStatus = z.infer<typeof SlaCreditStatusSchema>
export type SlaCreditSummary = z.infer<typeof SlaCreditSummarySchema>
export type SlaCredit = z.infer<typeof SlaCreditSchema>
export type SlaCreditList = z.infer<typeof SlaCreditListSchema>
export type CreateSlaCreditInput = z.infer<typeof CreateSlaCreditSchema>

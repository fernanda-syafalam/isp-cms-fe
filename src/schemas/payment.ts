import { z } from 'zod'

import { paymentId } from '@/types/ids'

export const PaymentMethodSchema = z.enum(['qris', 'va', 'ewallet', 'transfer', 'cash'])

export const PaymentSchema = z.object({
  id: paymentId,
  invoiceNo: z.string(),
  customerName: z.string(),
  amount: z.number().int().nonnegative(),
  method: PaymentMethodSchema,
  paidAt: z.iso.datetime(),
})

export const PaymentListSchema = z.object({
  items: z.array(PaymentSchema),
  total: z.number().int().nonnegative(),
})

// Input when recording a payment against an invoice.
export const RecordPaymentSchema = z.object({
  method: PaymentMethodSchema,
})

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>
export type Payment = z.infer<typeof PaymentSchema>
export type PaymentList = z.infer<typeof PaymentListSchema>
export type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>

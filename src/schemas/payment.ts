import { z } from 'zod'

import { invoiceId, paymentId } from '@/types/ids'

export const PaymentMethodSchema = z.enum(['qris', 'va', 'ewallet', 'transfer', 'cash'])

export const PaymentSchema = z.object({
  id: paymentId,
  invoiceId: invoiceId,
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

// Input when recording a payment against an invoice (offline/loket).
export const RecordPaymentSchema = z.object({
  method: PaymentMethodSchema,
})

// Online payment gateway (QRIS / Virtual Account / e-wallet). Channels mirror
// what Midtrans/Xendit expose; this is mock-first but contract-ready.
export const PaymentChannelSchema = z.enum([
  'qris',
  'va_bca',
  'va_mandiri',
  'va_bri',
  'va_bni',
  'gopay',
  'ovo',
  'dana',
  'shopeepay',
])

export const PaymentIntentStatusSchema = z.enum(['pending', 'paid', 'expired'])

// A pending charge created at the gateway. Real gateways return a VA number or
// QR payload + a webhook on settlement; here the webhook is simulated.
export const PaymentIntentSchema = z.object({
  id: z.string(),
  invoiceId: invoiceId,
  invoiceNo: z.string(),
  customerName: z.string(),
  amount: z.number().int().nonnegative(),
  channel: PaymentChannelSchema,
  status: PaymentIntentStatusSchema,
  vaNumber: z.string().nullable(),
  qrPayload: z.string().nullable(),
  createdAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  paidAt: z.iso.datetime().nullable(),
})

export const CreatePaymentIntentSchema = z.object({
  invoiceId: z.string().min(1),
  channel: PaymentChannelSchema,
})

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>
export type Payment = z.infer<typeof PaymentSchema>
export type PaymentList = z.infer<typeof PaymentListSchema>
export type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>
export type PaymentChannel = z.infer<typeof PaymentChannelSchema>
export type PaymentIntentStatus = z.infer<typeof PaymentIntentStatusSchema>
export type PaymentIntent = z.infer<typeof PaymentIntentSchema>
export type CreatePaymentIntentInput = z.infer<typeof CreatePaymentIntentSchema>

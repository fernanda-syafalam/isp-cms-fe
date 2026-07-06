import { z } from 'zod'

import { customerId, invoiceId, paymentId } from '@/types/ids'

export const PaymentMethodSchema = z.enum(['qris', 'va', 'ewallet', 'transfer', 'cash'])

export const PaymentSourceSchema = z.enum(['invoice', 'voucher'])

export const PaymentSchema = z.object({
  id: paymentId,
  // Invoice/customer are nullable: a voucher settlement (P3.D.3) writes a payment
  // with no invoice and (usually) no named customer.
  invoiceId: invoiceId.nullable(),
  invoiceNo: z.string().nullable(),
  customerId: customerId.nullable(),
  customerName: z.string().nullable(),
  amount: z.number().int().nonnegative(),
  method: PaymentMethodSchema,
  paidAt: z.iso.datetime(),
  // Cash-drawer fields (loket/tunai): uang diterima + kembalian. Null for any
  // non-cash method (QRIS/VA/e-wallet/transfer) where no change is handled.
  tenderedAmount: z.number().int().nonnegative().nullable(),
  changeAmount: z.number().int().nonnegative().nullable(),
  // What produced this payment: settling an invoice, or redeeming a voucher.
  source: PaymentSourceSchema,
  voucherId: z.string().nullable(),
})

// Full-set rollups over ALL payments (ignores the method filter) — drives the
// KPI cards and the method filter tabs.
export const PaymentSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  totalAmount: z.number().int().nonnegative(),
  byMethod: z.object({
    qris: z.number().int().nonnegative(),
    va: z.number().int().nonnegative(),
    ewallet: z.number().int().nonnegative(),
    transfer: z.number().int().nonnegative(),
    cash: z.number().int().nonnegative(),
  }),
})

export const PaymentListSchema = z.object({
  items: z.array(PaymentSchema),
  total: z.number().int().nonnegative(),
  summary: PaymentSummarySchema,
})

export type PaymentSummary = z.infer<typeof PaymentSummarySchema>

// Input when recording a payment against an invoice (offline/loket). `amount`
// is optional — omitted means pay the full balanceDue; a smaller value records a
// partial payment. `tenderedAmount` (uang diterima) is cash-only and drives the
// change (kembalian) computation server-side.
export const RecordPaymentSchema = z.object({
  method: PaymentMethodSchema,
  amount: z.number().int().positive().optional(),
  tenderedAmount: z.number().int().positive().optional(),
})

// GET /v1/payments/reconciliation?date=YYYY-MM-DD — end-of-day cash-drawer +
// per-method totals for the given date (admin/staff).
export const PaymentReconciliationSchema = z.object({
  date: z.iso.date(),
  byMethod: z.array(
    z.object({
      method: z.string(),
      count: z.number().int().nonnegative(),
      totalAmount: z.number().int().nonnegative(),
    }),
  ),
  totalCount: z.number().int().nonnegative(),
  totalAmount: z.number().int().nonnegative(),
  cash: z.object({
    totalTendered: z.number().int().nonnegative(),
    totalChange: z.number().int().nonnegative(),
  }),
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

export type PaymentSource = z.infer<typeof PaymentSourceSchema>
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>
export type Payment = z.infer<typeof PaymentSchema>
export type PaymentList = z.infer<typeof PaymentListSchema>
export type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>
export type PaymentReconciliation = z.infer<typeof PaymentReconciliationSchema>
export type PaymentChannel = z.infer<typeof PaymentChannelSchema>
export type PaymentIntentStatus = z.infer<typeof PaymentIntentStatusSchema>
export type PaymentIntent = z.infer<typeof PaymentIntentSchema>
export type CreatePaymentIntentInput = z.infer<typeof CreatePaymentIntentSchema>

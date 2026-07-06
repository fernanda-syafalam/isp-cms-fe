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

// Self-care data-usage snapshot for the current customer (P3.C.4). Mirrors the
// backend GET /portal/usage shape; 404 when the subscriber is not provisioned.
// `quotaGb === 0` means unlimited; `fupThrottled` is set when over the FUP cap.
export const PortalUsageSchema = z.object({
  customerId: z.string(),
  customerName: z.string(),
  planName: z.string(),
  quotaGb: z.number().nonnegative(),
  usedGb: z.number().nonnegative(),
  fupThrottled: z.boolean(),
  trend: z.array(z.number().nonnegative()), // last 7 days, GB/day
})

// The customer's CPE and current Wi-Fi SSID (P3.C.4). `ssid` is null until the
// customer first names their network.
export const PortalWifiSchema = z.object({
  serial: z.string(),
  model: z.string(),
  ssid: z.string().nullable(),
})

// Self-care Wi-Fi change request. SSID 1..32, WPA2 passphrase 8..63 chars.
export const PortalWifiUpdateSchema = z.object({
  ssid: z
    .string()
    .min(1, 'Nama Wi-Fi tidak boleh kosong')
    .max(32, 'Nama Wi-Fi maksimal 32 karakter'),
  password: z
    .string()
    .min(8, 'Kata sandi minimal 8 karakter')
    .max(63, 'Kata sandi maksimal 63 karakter'),
})

// Response of a successful Wi-Fi change.
export const PortalWifiUpdateResultSchema = z.object({
  ok: z.literal(true),
  ssid: z.string(),
})

export type PortalMe = z.infer<typeof PortalMeSchema>
export type ReportIssueInput = z.infer<typeof ReportIssueSchema>
export type PortalUsage = z.infer<typeof PortalUsageSchema>
export type PortalWifi = z.infer<typeof PortalWifiSchema>
export type PortalWifiUpdate = z.infer<typeof PortalWifiUpdateSchema>
export type PortalWifiUpdateResult = z.infer<typeof PortalWifiUpdateResultSchema>

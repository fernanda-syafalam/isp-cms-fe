import { api } from './client'
import { type Announcement, AnnouncementSchema } from '@/schemas/announcement'
import {
  type CreatePaymentIntentInput,
  type PaymentIntent,
  PaymentIntentSchema,
} from '@/schemas/payment'
import {
  type PortalMe,
  PortalMeSchema,
  type PortalUsage,
  PortalUsageSchema,
  type PortalWifi,
  PortalWifiSchema,
  type PortalWifiUpdate,
  type PortalWifiUpdateResult,
  PortalWifiUpdateResultSchema,
  type ReportIssueInput,
} from '@/schemas/portal'
import {
  type AddCommentInput,
  type PortalTicketDetail,
  PortalTicketDetailSchema,
  type SubmitCsatInput,
  type Ticket,
  TicketSchema,
} from '@/schemas/ticket'

// The current customer's self-service snapshot.
export async function getPortalMe(): Promise<PortalMe> {
  const json = await api.get('portal/me').json()
  return PortalMeSchema.parse(json)
}

// The current customer's data-usage snapshot (quota, FUP, 7-day trend).
export async function getPortalUsage(): Promise<PortalUsage> {
  const json = await api.get('portal/usage').json()
  return PortalUsageSchema.parse(json)
}

// The current customer's CPE and Wi-Fi SSID.
export async function getPortalWifi(): Promise<PortalWifi> {
  const json = await api.get('portal/wifi').json()
  return PortalWifiSchema.parse(json)
}

// Customer renames their Wi-Fi / sets a new passphrase (self-care).
export async function updatePortalWifi(input: PortalWifiUpdate): Promise<PortalWifiUpdateResult> {
  const json = await api.post('portal/wifi', { json: input }).json()
  return PortalWifiUpdateResultSchema.parse(json)
}

// Active operator broadcast notices for the portal (newest-first).
export async function getPortalAnnouncements(): Promise<Announcement[]> {
  const json = await api.get('portal/announcements').json()
  return AnnouncementSchema.array().parse(json)
}

// Customer reports a problem → opens a support ticket. Category is required by
// the backend; the optional photo URL is only forwarded when present.
export async function reportIssue(input: ReportIssueInput): Promise<void> {
  const json: { subject: string; category: string; photoUrl?: string } = {
    subject: input.subject,
    category: input.category,
  }
  if (input.photoUrl) json.photoUrl = input.photoUrl
  await api.post('portal/tickets', { json })
}

// A single ticket the customer owns, with its full activity timeline.
export async function getPortalTicket(id: string): Promise<PortalTicketDetail> {
  const json = await api.get(`portal/tickets/${id}`).json()
  return PortalTicketDetailSchema.parse(json)
}

// Customer adds a comment to their own ticket thread.
export async function addPortalComment(id: string, input: AddCommentInput): Promise<void> {
  await api.post(`portal/tickets/${id}/comments`, { json: input })
}

// Customer rates a resolved/breached ticket (CSAT).
export async function submitCsat(id: string, input: SubmitCsatInput): Promise<Ticket> {
  const json = await api.post(`portal/tickets/${id}/csat`, { json: input }).json()
  return TicketSchema.parse(json)
}

// Portal-scoped gateway charge — the customer creates the intent for their own
// invoice (the staff /payments/intent route is not reachable by a customer).
export async function createPortalPayIntent(
  input: CreatePaymentIntentInput,
): Promise<PaymentIntent> {
  const json = await api.post('portal/pay-intent', { json: input }).json()
  return PaymentIntentSchema.parse(json)
}

// Simulate the gateway settlement webhook from the portal — marks the intent +
// invoice paid and reactivates the subscriber when nothing overdue remains.
export async function confirmPortalPayIntent(id: string): Promise<PaymentIntent> {
  const json = await api.post(`portal/pay-intent/${id}/confirm`).json()
  return PaymentIntentSchema.parse(json)
}

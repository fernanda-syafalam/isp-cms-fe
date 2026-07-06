import { api } from './client'
import {
  type CreatePaymentIntentInput,
  type PaymentIntent,
  PaymentIntentSchema,
} from '@/schemas/payment'
import { type PortalMe, PortalMeSchema, type ReportIssueInput } from '@/schemas/portal'

// The current customer's self-service snapshot.
export async function getPortalMe(): Promise<PortalMe> {
  const json = await api.get('portal/me').json()
  return PortalMeSchema.parse(json)
}

// Customer reports a problem → opens a support ticket.
export async function reportIssue(input: ReportIssueInput): Promise<void> {
  await api.post('portal/tickets', { json: input })
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

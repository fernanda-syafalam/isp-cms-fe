import { api } from './client'
import {
  type CreatePaymentIntentInput,
  type PaymentIntent,
  PaymentIntentSchema,
  type PaymentList,
  PaymentListSchema,
} from '@/schemas/payment'

export async function listPayments(): Promise<PaymentList> {
  const json = await api.get('payments').json()
  return PaymentListSchema.parse(json)
}

// Create a gateway charge for an invoice (mock returns VA/QR + pending status).
export async function createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntent> {
  const json = await api.post('payments/intent', { json: input }).json()
  return PaymentIntentSchema.parse(json)
}

// Simulate the gateway settlement webhook: marks the intent + invoice paid.
export async function confirmPaymentIntent(id: string): Promise<PaymentIntent> {
  const json = await api.post(`payments/intent/${id}/confirm`).json()
  return PaymentIntentSchema.parse(json)
}

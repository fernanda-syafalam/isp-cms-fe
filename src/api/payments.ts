import { api } from './client'
import { PaymentListSchema, type PaymentList } from '@/schemas/payment'

export async function listPayments(): Promise<PaymentList> {
  const json = await api.get('payments').json()
  return PaymentListSchema.parse(json)
}

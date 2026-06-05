import { api } from './client'
import {
  type BillingRunResult,
  BillingRunResultSchema,
  type IsolirResult,
  IsolirResultSchema,
} from '@/schemas/billing'

// Generate invoices for the current period for all active subscribers (mock).
export async function runBilling(): Promise<BillingRunResult> {
  const json = await api.post('billing/run').json()
  return BillingRunResultSchema.parse(json)
}

// Flag overdue invoices + suspend (isolir) all active subscribers who owe.
export async function isolirOverdue(): Promise<IsolirResult> {
  const json = await api.post('billing/isolir-overdue').json()
  return IsolirResultSchema.parse(json)
}

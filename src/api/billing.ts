import { api } from './client'
import {
  type BillingRunResult,
  BillingRunResultSchema,
  type IsolirResult,
  IsolirResultSchema,
  type RemindResult,
  RemindResultSchema,
  type SchedulerPreview,
  SchedulerPreviewSchema,
  type SchedulerRunResult,
  SchedulerRunResultSchema,
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

// Send a payment reminder (dunning). With `invoiceIds` reminds those specific
// unpaid invoices; without it, reminds every overdue invoice (all penunggak).
export async function remindOverdue(invoiceIds?: string[]): Promise<RemindResult> {
  const json = await api.post('billing/remind', { json: { invoiceIds } }).json()
  return RemindResultSchema.parse(json)
}

// What the automated billing cycle would do next (no mutation).
export async function getSchedulerPreview(): Promise<SchedulerPreview> {
  const json = await api.get('billing/scheduler/preview').json()
  return SchedulerPreviewSchema.parse(json)
}

// Run the full automated cycle once: bill → mark overdue → remind → isolir.
export async function runScheduler(): Promise<SchedulerRunResult> {
  const json = await api.post('billing/scheduler/run').json()
  return SchedulerRunResultSchema.parse(json)
}

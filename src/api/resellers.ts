import { api } from './client'
import {
  type AddLedgerEntryInput,
  type CreatePayoutInput,
  type CreateResellerInput,
  type LedgerList,
  LedgerListSchema,
  type Payout,
  type PayoutList,
  PayoutListSchema,
  PayoutSchema,
  type Reseller,
  ResellerListSchema,
  ResellerSchema,
  type ResellerList,
  type UpdateResellerInput,
} from '@/schemas/reseller'

export type ResellerFilter = {
  q?: string | undefined
  status?: string | undefined
  sort?: string | undefined
  order?: 'asc' | 'desc' | undefined
  limit?: number | undefined
  offset?: number | undefined
}

// The ledger is a per-reseller transaction log (no status facet) — search,
// single-column sort, and limit/offset paging only.
export type LedgerFilter = {
  q?: string | undefined
  sort?: string | undefined
  order?: 'asc' | 'desc' | undefined
  limit?: number | undefined
  offset?: number | undefined
}

// Backend caps a page at 200 rows; the CSV export pulls a single max-size page
// so it covers the full filtered set without a paging loop.
export const RESELLER_EXPORT_LIMIT = 200

export async function listResellers(filter: ResellerFilter = {}): Promise<ResellerList> {
  const searchParams = new URLSearchParams()
  if (filter.q) searchParams.set('q', filter.q)
  if (filter.status) searchParams.set('status', filter.status)
  if (filter.sort) searchParams.set('sort', filter.sort)
  if (filter.order) searchParams.set('order', filter.order)
  if (filter.limit !== undefined) searchParams.set('limit', String(filter.limit))
  if (filter.offset !== undefined) searchParams.set('offset', String(filter.offset))
  const json = await api.get('resellers', { searchParams }).json()
  return ResellerListSchema.parse(json)
}

// Create a reseller (admin/staff). Returns the new record (customerCount 0).
export async function createReseller(input: CreateResellerInput): Promise<Reseller> {
  const json = await api.post('resellers', { json: input }).json()
  return ResellerSchema.parse(json)
}

export async function getReseller(id: string): Promise<Reseller> {
  const json = await api.get(`resellers/${id}`).json()
  return ResellerSchema.parse(json)
}

// Edit reseller, or deactivate (soft-delete) by sending { status: 'inactive' }.
export async function updateReseller(id: string, input: UpdateResellerInput): Promise<Reseller> {
  const json = await api.patch(`resellers/${id}`, { json: input }).json()
  return ResellerSchema.parse(json)
}

export async function listResellerLedger(
  id: string,
  filter: LedgerFilter = {},
): Promise<LedgerList> {
  const searchParams = new URLSearchParams()
  if (filter.q) searchParams.set('q', filter.q)
  if (filter.sort) searchParams.set('sort', filter.sort)
  if (filter.order) searchParams.set('order', filter.order)
  if (filter.limit !== undefined) searchParams.set('limit', String(filter.limit))
  if (filter.offset !== undefined) searchParams.set('offset', String(filter.offset))
  const json = await api.get(`resellers/${id}/ledger`, { searchParams }).json()
  return LedgerListSchema.parse(json)
}

// Append a ledger entry (top-up, commission, deduction). Withdrawals now go
// through the payout flow below; a direct `withdrawal` post is rejected (422).
export async function addLedgerEntry(id: string, input: AddLedgerEntryInput): Promise<Reseller> {
  const json = await api.post(`resellers/${id}/ledger`, { json: input }).json()
  return ResellerSchema.parse(json)
}

// Payouts (P3.D.4) — a reseller cash-out request and its lifecycle.
export async function listPayouts(resellerId: string): Promise<PayoutList> {
  const json = await api.get(`resellers/${resellerId}/payouts`).json()
  return PayoutListSchema.parse(json)
}

export async function createPayout(resellerId: string, input: CreatePayoutInput): Promise<Payout> {
  const json = await api.post(`resellers/${resellerId}/payouts`, { json: input }).json()
  return PayoutSchema.parse(json)
}

export async function approvePayout(resellerId: string, payoutId: string): Promise<Payout> {
  const json = await api.post(`resellers/${resellerId}/payouts/${payoutId}/approve`).json()
  return PayoutSchema.parse(json)
}

export async function rejectPayout(resellerId: string, payoutId: string): Promise<Payout> {
  const json = await api.post(`resellers/${resellerId}/payouts/${payoutId}/reject`).json()
  return PayoutSchema.parse(json)
}

// Disburse debits the reseller balance (via a withdrawal ledger entry) and
// 422s on insufficient balance.
export async function disbursePayout(resellerId: string, payoutId: string): Promise<Payout> {
  const json = await api.post(`resellers/${resellerId}/payouts/${payoutId}/disburse`).json()
  return PayoutSchema.parse(json)
}

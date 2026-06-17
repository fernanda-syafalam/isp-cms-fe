import { api } from './client'
import {
  type AddLedgerEntryInput,
  type LedgerList,
  LedgerListSchema,
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

export async function getReseller(id: string): Promise<Reseller> {
  const json = await api.get(`resellers/${id}`).json()
  return ResellerSchema.parse(json)
}

// Edit reseller, or deactivate (soft-delete) by sending { status: 'inactive' }.
export async function updateReseller(id: string, input: UpdateResellerInput): Promise<Reseller> {
  const json = await api.patch(`resellers/${id}`, { json: input }).json()
  return ResellerSchema.parse(json)
}

export async function listResellerLedger(id: string): Promise<LedgerList> {
  const json = await api.get(`resellers/${id}/ledger`).json()
  return LedgerListSchema.parse(json)
}

// Append a ledger entry (top-up, commission, deduction, withdrawal). Returns the
// reseller with its updated balance.
export async function addLedgerEntry(id: string, input: AddLedgerEntryInput): Promise<Reseller> {
  const json = await api.post(`resellers/${id}/ledger`, { json: input }).json()
  return ResellerSchema.parse(json)
}

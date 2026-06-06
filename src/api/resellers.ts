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

export async function listResellers(): Promise<ResellerList> {
  const json = await api.get('resellers').json()
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

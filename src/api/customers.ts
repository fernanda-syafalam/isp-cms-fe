import { api } from './client'
import {
  type ChangePlanInput,
  type CreateCustomerInput,
  type Customer,
  CustomerListSchema,
  CustomerSchema,
  type CustomerList,
  type RelocateCustomerInput,
  type SetWifiInput,
  type UpdateKycInput,
} from '@/schemas/customer'

export type CustomerFilter = {
  q?: string | undefined
  status?: string | undefined
  // Service-area scope (resolved from the active branch); a repeated `area`
  // param. Omitted = no area constraint. Unassigned customers are included by
  // the server in every scope, so they are never filtered out here.
  area?: string[] | undefined
  sort?: string | undefined
  order?: 'asc' | 'desc' | undefined
  limit?: number | undefined
  offset?: number | undefined
}

// Upper bound for an "export all" pull (the CSV download ignores paging).
export const CUSTOMER_EXPORT_LIMIT = 500

export async function listCustomers(filter: CustomerFilter = {}): Promise<CustomerList> {
  const searchParams = new URLSearchParams()
  if (filter.q) searchParams.set('q', filter.q)
  if (filter.status) searchParams.set('status', filter.status)
  for (const area of filter.area ?? []) searchParams.append('area', area)
  if (filter.sort) searchParams.set('sort', filter.sort)
  if (filter.order) searchParams.set('order', filter.order)
  if (filter.limit !== undefined) searchParams.set('limit', String(filter.limit))
  if (filter.offset !== undefined) searchParams.set('offset', String(filter.offset))
  const json = await api.get('customers', { searchParams }).json()
  return CustomerListSchema.parse(json)
}

export async function getCustomer(id: string): Promise<Customer> {
  const json = await api.get(`customers/${id}`).json()
  return CustomerSchema.parse(json)
}

export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const json = await api.post('customers', { json: input }).json()
  return CustomerSchema.parse(json)
}

export async function updateCustomer(id: string, input: CreateCustomerInput): Promise<Customer> {
  const json = await api.patch(`customers/${id}`, { json: input }).json()
  return CustomerSchema.parse(json)
}

// Soft-delete: move the subscriber to the "berhenti" (churned) lifecycle state.
export async function stopCustomer(id: string): Promise<Customer> {
  const json = await api.post(`customers/${id}/stop`).json()
  return CustomerSchema.parse(json)
}

// Change plan (mock prorates the difference into a new invoice + updates profile).
export async function changeCustomerPlan(id: string, input: ChangePlanInput): Promise<Customer> {
  const json = await api.post(`customers/${id}/change-plan`, { json: input }).json()
  return CustomerSchema.parse(json)
}

// Relocation (mutasi): update the subscriber's address + service area.
export async function relocateCustomer(
  id: string,
  input: RelocateCustomerInput,
): Promise<Customer> {
  const json = await api.post(`customers/${id}/relocate`, { json: input }).json()
  return CustomerSchema.parse(json)
}

// UU PDP: record the subscriber's consent to data processing.
export async function recordConsent(id: string): Promise<Customer> {
  const json = await api.post(`customers/${id}/consent`).json()
  return CustomerSchema.parse(json)
}

// KYC capture (NIK/KTP, NPWP).
export async function updateKyc(id: string, input: UpdateKycInput): Promise<Customer> {
  const json = await api.patch(`customers/${id}/kyc`, { json: input }).json()
  return CustomerSchema.parse(json)
}

// Data-subject erasure request (UU PDP); a real backend queues anonymization.
export async function requestDataDeletion(id: string): Promise<void> {
  await api.post(`customers/${id}/data-deletion`)
}

// Voluntary suspension at the customer's request (dormant). Distinct from the
// non-payment isolir trigger and from churn (stop). Resume restores service
// without clearing any outstanding balance.
export async function suspendCustomer(id: string): Promise<Customer> {
  const json = await api.post(`customers/${id}/suspend`).json()
  return CustomerSchema.parse(json)
}

export async function resumeCustomer(id: string): Promise<Customer> {
  const json = await api.post(`customers/${id}/resume`).json()
  return CustomerSchema.parse(json)
}

// Network enforcement actions (mock now; real backend will hit Mikrotik/RADIUS).
// Isolir blocks access; aktivasi restores it. Both return the updated customer.
export async function isolateCustomer(id: string): Promise<Customer> {
  const json = await api.post(`customers/${id}/isolate`).json()
  return CustomerSchema.parse(json)
}

export async function activateCustomer(id: string): Promise<Customer> {
  const json = await api.post(`customers/${id}/activate`).json()
  return CustomerSchema.parse(json)
}

// GenieACS / TR-069 actions against the subscriber's ONU (mock now).
export async function rebootOnu(id: string): Promise<Customer> {
  const json = await api.post(`customers/${id}/onu/reboot`).json()
  return CustomerSchema.parse(json)
}

export async function setOnuWifi(id: string, input: SetWifiInput): Promise<Customer> {
  const json = await api.post(`customers/${id}/onu/wifi`, { json: input }).json()
  return CustomerSchema.parse(json)
}

// Send a billing reminder via WhatsApp gateway (mock now).
export async function notifyWhatsapp(id: string): Promise<Customer> {
  const json = await api.post(`customers/${id}/notify/whatsapp`).json()
  return CustomerSchema.parse(json)
}

import { api } from './client'
import {
  type CreateCustomerInput,
  type Customer,
  CustomerListSchema,
  CustomerSchema,
  type CustomerList,
} from '@/schemas/customer'

export type CustomerFilter = {
  q?: string | undefined
  status?: string | undefined
}

export async function listCustomers(filter: CustomerFilter = {}): Promise<CustomerList> {
  const searchParams = new URLSearchParams()
  if (filter.q) searchParams.set('q', filter.q)
  if (filter.status) searchParams.set('status', filter.status)
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

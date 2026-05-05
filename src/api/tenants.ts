import { api } from './client'
import {
  TenantListSchema,
  TenantSchema,
  type CreateTenantInput,
  type Tenant,
  type TenantFilter,
  type TenantList,
} from '@/schemas/tenant'
import type { TenantId } from '@/types/ids'

export async function listTenants(filter: TenantFilter): Promise<TenantList> {
  const json = await api.get('tenants', { searchParams: filter }).json()
  return TenantListSchema.parse(json)
}

export async function getTenant(id: TenantId): Promise<Tenant> {
  const json = await api.get(`tenants/${id}`).json()
  return TenantSchema.parse(json)
}

export async function createTenant(input: CreateTenantInput): Promise<Tenant> {
  const json = await api.post('tenants', { json: input }).json()
  return TenantSchema.parse(json)
}

export async function suspendTenant(id: TenantId): Promise<Tenant> {
  const json = await api.post(`tenants/${id}/suspend`).json()
  return TenantSchema.parse(json)
}

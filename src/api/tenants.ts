import { api } from './client'
import {
  TenantListSchema,
  TenantSchema,
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

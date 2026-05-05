import { useQuery } from '@tanstack/react-query'

import { getTenant, listTenants } from '@/api/tenants'
import type { TenantFilter } from '@/schemas/tenant'
import type { TenantId } from '@/types/ids'

export function useTenantsList(filter: TenantFilter) {
  return useQuery({
    queryKey: ['tenants', 'list', filter] as const,
    queryFn: () => listTenants(filter),
  })
}

export function useTenant(id: TenantId) {
  return useQuery({
    queryKey: ['tenants', 'detail', id] as const,
    queryFn: () => getTenant(id),
  })
}

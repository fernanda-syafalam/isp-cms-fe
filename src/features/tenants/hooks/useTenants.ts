import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { createTenant, getTenant, listTenants, suspendTenant } from '@/api/tenants'
import { getErrorMessage } from '@/lib/errors'
import type { CreateTenantInput, TenantFilter } from '@/schemas/tenant'
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

export function useCreateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTenantInput) => createTenant(input),
    onSuccess: (tenant) => {
      qc.invalidateQueries({ queryKey: ['tenants'] })
      toast.success(`Tenant "${tenant.name}" created`)
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useSuspendTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: TenantId) => suspendTenant(id),
    onSuccess: (tenant) => {
      qc.invalidateQueries({ queryKey: ['tenants'] })
      qc.setQueryData(['tenants', 'detail', tenant.id], tenant)
      toast.success(`Tenant "${tenant.name}" suspended`)
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}

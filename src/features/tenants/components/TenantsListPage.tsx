import { useState } from 'react'

import { TenantFilterSchema, type TenantFilter } from '@/schemas/tenant'

import { CreateTenantDialog } from './CreateTenantDialog'
import { TenantFilterBar } from './TenantFilterBar'
import { TenantsTable } from './TenantsTable'
import { useSuspendTenant, useTenantsList } from '../hooks/useTenants'

const DEFAULT_FILTER: TenantFilter = TenantFilterSchema.parse({})

export function TenantsListPage() {
  const [filter, setFilter] = useState<TenantFilter>(DEFAULT_FILTER)
  const { data, isLoading, isError } = useTenantsList(filter)
  const suspendMutation = useSuspendTenant()

  const pageIndex = filter.page - 1

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-2xl tracking-tight">Tenants</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Onboard and manage clinic tenants and their status.
          </p>
        </div>
        <CreateTenantDialog />
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <TenantFilterBar value={filter} onChange={setFilter} />
        <TenantsTable
          tenants={data?.items}
          total={data?.total ?? 0}
          isLoading={isLoading}
          isError={isError}
          pageIndex={pageIndex}
          pageSize={filter.pageSize}
          onPageChange={(nextPageIndex) => setFilter({ ...filter, page: nextPageIndex + 1 })}
          onSuspend={(id) => suspendMutation.mutate(id)}
        />
      </div>
    </div>
  )
}

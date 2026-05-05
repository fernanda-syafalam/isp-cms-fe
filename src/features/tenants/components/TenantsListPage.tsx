import { useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tenants</CardTitle>
        <CreateTenantDialog />
      </CardHeader>
      <Separator />
      <CardContent className="space-y-4 pt-6">
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
      </CardContent>
    </Card>
  )
}

import { Button } from '@/components/ui/button'

import { useTenant } from '../hooks/useTenants'
import type { TenantId } from '@/types/ids'

type Props = {
  tenantId: TenantId
  onSuspend: (id: TenantId) => void
}

export function TenantCard({ tenantId, onSuspend }: Props) {
  const { data: tenant, isLoading, isError } = useTenant(tenantId)

  if (isLoading) return <TenantCardSkeleton />
  if (isError || !tenant) return <p role="alert">Tenant not found.</p>

  return (
    <article className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <h2 className="text-lg font-medium">{tenant.name}</h2>
      <p className="text-sm text-muted-foreground">{tenant.email}</p>
      <Button variant="destructive" size="sm" className="mt-3" onClick={() => onSuspend(tenant.id)}>
        Suspend
      </Button>
    </article>
  )
}

function TenantCardSkeleton() {
  return <div aria-busy className="h-24 animate-pulse rounded-lg bg-muted" />
}

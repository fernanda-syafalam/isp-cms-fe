import { Badge } from '@/components/ui/badge'
import type { Tenant } from '@/schemas/tenant'

const variantByStatus: Record<Tenant['status'], 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  pending: 'secondary',
  suspended: 'destructive',
}

type Props = {
  status: Tenant['status']
}

export function TenantStatusBadge({ status }: Props) {
  return <Badge variant={variantByStatus[status]}>{status}</Badge>
}

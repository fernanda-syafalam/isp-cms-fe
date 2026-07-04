import { Badge } from '@/components/ui/badge'
import { statusLabel } from '@/lib/status-label'
import type { UserRole } from '@/schemas/user'

const variantByRole: Record<UserRole, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  staff: 'secondary',
  teknisi: 'secondary',
  mitra: 'outline',
  customer: 'outline',
}

type Props = {
  role: UserRole
}

export function UserRoleBadge({ role }: Props) {
  return <Badge variant={variantByRole[role]}>{statusLabel(role)}</Badge>
}

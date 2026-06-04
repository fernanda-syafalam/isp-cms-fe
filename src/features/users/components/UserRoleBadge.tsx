import { Badge } from '@/components/ui/badge'
import type { UserRole } from '@/schemas/user'

const variantByRole: Record<UserRole, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  staff: 'secondary',
  customer: 'outline',
}

type Props = {
  role: UserRole
}

export function UserRoleBadge({ role }: Props) {
  return <Badge variant={variantByRole[role]}>{role}</Badge>
}

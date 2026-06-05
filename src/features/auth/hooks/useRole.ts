import { type Permission, type Role, can } from '@/lib/permissions'

import { useCurrentUser } from './useAuth'
import { useRoleStore } from '../store/roleStore'

// Effective role = dev override (if set) else the logged-in user's role.
export function useEffectiveRole(): Role {
  const { data: user } = useCurrentUser()
  const override = useRoleStore((s) => s.override)
  return override ?? user?.role ?? 'staff'
}

export function useCan(permission: Permission): boolean {
  return can(useEffectiveRole(), permission)
}

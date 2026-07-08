import { type Permission, type Role, can } from '@/lib/permissions'

import { useCurrentUser } from './useAuth'
import { useRoleStore } from '../store/roleStore'

// Effective role = the logged-in user's role. In dev builds a demo override
// (from the UserMenu switcher) may stand in for it; in production the override
// branch is stripped (`import.meta.env.DEV` folds to `false`) so a real user's
// effective role is always their actual role (FEsec-H1).
export function useEffectiveRole(): Role {
  const { data: user } = useCurrentUser()
  const override = useRoleStore((s) => s.override)
  if (import.meta.env.DEV && override) return override
  return user?.role ?? 'staff'
}

export function useCan(permission: Permission): boolean {
  return can(useEffectiveRole(), permission)
}

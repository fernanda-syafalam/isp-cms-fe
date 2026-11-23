import { Navigate, Outlet, useRouterState } from '@tanstack/react-router'

import { RoutePending } from '@/components/shared/route-pending'
import { ROLE_HOME, isRouteAllowed } from '@/components/shared/nav'

import { useRoleStatus } from '../hooks/useRole'

export function RoleGuard() {
  const { role, isResolving } = useRoleStatus()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  // The role is unknown until /auth/me answers; evaluating the 'staff' fallback
  // would bounce an admin deep-linking to an admin-only page.
  if (isResolving) return <RoutePending />

  // No role may reach a page outside its allowlist via deep-link or bookmark —
  // bounce them to their home (the sidebar uses the same allowlist). The guard
  // must run for EVERY role, not only those with a ROLE_HOME entry, so a role
  // without an explicit home still can't bypass the check; fall back to "/".
  if (!isRouteAllowed(role, pathname)) {
    return <Navigate to={ROLE_HOME[role] ?? '/'} replace />
  }

  return <Outlet />
}

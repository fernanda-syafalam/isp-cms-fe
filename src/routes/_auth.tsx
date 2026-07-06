import { Navigate, Outlet, createFileRoute, redirect, useRouterState } from '@tanstack/react-router'

import { refreshSession } from '@/api/auth'
import { ROLE_HOME, isRouteAllowed } from '@/components/shared/nav'
import { useEffectiveRole } from '@/features/auth'
import { useAuthStore } from '@/features/auth/store/authStore'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ location }) => {
    const store = useAuthStore.getState()
    if (store.accessToken) return

    // Attempt silent refresh from HttpOnly cookie before bouncing to /login.
    try {
      const session = await refreshSession()
      store.setSession(session)
    } catch {
      throw redirect({ to: '/login', search: { from: location.href } })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  const role = useEffectiveRole()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  // No role may reach a page outside its allowlist via deep-link or bookmark —
  // bounce them to their home (the sidebar uses the same allowlist). The guard
  // must run for EVERY role, not only those with a ROLE_HOME entry, so a role
  // without an explicit home still can't bypass the check; fall back to "/".
  if (!isRouteAllowed(role, pathname)) {
    return <Navigate to={ROLE_HOME[role] ?? '/'} replace />
  }

  return <Outlet />
}

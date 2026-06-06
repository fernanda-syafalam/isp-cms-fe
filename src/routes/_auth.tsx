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

  // Restricted roles can't reach pages outside their allowlist via deep-link or
  // bookmark — bounce them to their home (sidebar uses the same allowlist).
  const home = ROLE_HOME[role]
  if (home && !isRouteAllowed(role, pathname)) {
    return <Navigate to={home} replace />
  }

  return <Outlet />
}

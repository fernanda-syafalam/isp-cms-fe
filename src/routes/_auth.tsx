import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { refreshSession } from '@/api/auth'
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
  return <Outlet />
}

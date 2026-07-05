import { createFileRoute, redirect } from '@tanstack/react-router'

import { getBootstrapStatus } from '@/api/auth'

// Public first-run route (P3.E.1). Single-use: if the instance is already
// bootstrapped, bounce to /login. The status is cached under ['auth','bootstrap']
// so login.tsx and this route share one request. A failed status check must not
// brick the screen — default to "not required" and let /login handle it.
export const Route = createFileRoute('/bootstrap')({
  beforeLoad: async ({ context }) => {
    const status = await context.queryClient
      .ensureQueryData({
        queryKey: ['auth', 'bootstrap'],
        queryFn: getBootstrapStatus,
      })
      .catch(() => ({ required: false }))
    if (!status.required) {
      throw redirect({ to: '/login' })
    }
  },
})

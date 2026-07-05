import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'

import { getBootstrapStatus } from '@/api/auth'

// Search-param validation must run on the eager route file so navigation
// guards (e.g. _auth.tsx redirecting with ?from=...) can rely on it without
// waiting for the lazy chunk.
const loginSearchSchema = z.object({
  from: z.string().optional(),
})

export const Route = createFileRoute('/login')({
  // A fresh install (zero users) has no credentials to log in with — send it
  // to the one-time create-admin screen instead. Status is cached under
  // ['auth','bootstrap'] (shared with /bootstrap); a failed check falls back
  // to showing the login form rather than blocking it.
  beforeLoad: async ({ context }) => {
    const status = await context.queryClient
      .ensureQueryData({
        queryKey: ['auth', 'bootstrap'],
        queryFn: getBootstrapStatus,
      })
      .catch(() => ({ required: false }))
    if (status.required) {
      throw redirect({ to: '/bootstrap' })
    }
  },
  validateSearch: loginSearchSchema,
})

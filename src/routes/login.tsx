import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

// Search-param validation must run on the eager route file so navigation
// guards (e.g. _auth.tsx redirecting with ?from=...) can rely on it without
// waiting for the lazy chunk.
const loginSearchSchema = z.object({
  from: z.string().optional(),
})

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
})

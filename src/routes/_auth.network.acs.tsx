import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

// Optional ?q=<serial> deep-link (e.g. from a customer's connection tab) to
// prefilter the ONU table. Component is code-split into
// _auth.network.acs.lazy.tsx.
const searchSchema = z.object({
  q: z.string().optional(),
})

export const Route = createFileRoute('/_auth/network/acs')({
  validateSearch: searchSchema,
})

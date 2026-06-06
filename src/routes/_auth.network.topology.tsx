import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

// Optional ?focus=<nodeId> deep-link (e.g. from a customer detail page) to
// preselect a node on the map. The component (and its Leaflet dependency)
// lives in _auth.network.topology.lazy.tsx so the map is code-split out of the
// critical-path bundle (ADR-0004).
const searchSchema = z.object({
  focus: z.string().optional(),
})

export const Route = createFileRoute('/_auth/network/topology')({
  validateSearch: searchSchema,
})

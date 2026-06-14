import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { NodeStatusSchema, NodeTypeSchema } from '@/schemas/topology'

// Deep-linkable view state for the topology map, so a filtered/selected view
// survives refresh and can be shared (e.g. "here are the down nodes"). All
// fields optional — a bare /network/topology URL writes no params; defaults
// (map view, satellite base, "all" filters) are applied in useTopologySearch.
//
// `focus` is the legacy single-node deep-link (from a customer detail page);
// `sel` supersedes it. Both preselect a node; the hook folds focus → sel on the
// first interaction. Validation lives on this eager route file (not the lazy
// chunk) so navigation can rely on it without waiting for Leaflet to load
// (ADR-0004).
const searchSchema = z.object({
  focus: z.string().optional(),
  sel: z.string().optional(),
  view: z.enum(['map', 'list']).optional(),
  base: z.enum(['map', 'satellite']).optional(),
  layer: z.enum(['logical', 'physical']).optional(),
  type: z.union([z.literal('all'), NodeTypeSchema]).optional(),
  status: z.union([z.literal('all'), NodeStatusSchema]).optional(),
})

export const Route = createFileRoute('/_auth/network/topology')({
  validateSearch: searchSchema,
})

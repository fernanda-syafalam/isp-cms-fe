import { z } from 'zod'

// A splice closure / joint enclosure, co-located with an ODC/ODP node. Holds
// the strand-to-strand splices that join an upstream cable to downstream drops.
// (Schemas are defined now for a complete OSP model; closure/splice fixtures and
// UI are an optional later phase — see the plan.)
export const ClosureTypeSchema = z.enum(['odc', 'odp', 'joint', 'inline'])

export const ClosureSchema = z.object({
  id: z.string().min(1),
  type: ClosureTypeSchema,
  nodeId: z.string().min(1), // host NetworkNode
  trayCapacity: z.number().int().positive(),
  fiberCapacity: z.number().int().positive(),
})

export const SpliceTypeSchema = z.enum(['fusion', 'mechanical', 'passthrough'])

// One fiber joint inside a closure: an IN strand fused to an OUT strand.
export const SpliceSchema = z.object({
  id: z.string().min(1),
  closureId: z.string().min(1),
  inCableId: z.string().min(1),
  inTubeNo: z.number().int().positive(),
  inCoreNo: z.number().int().min(1).max(12),
  outCableId: z.string().min(1),
  outTubeNo: z.number().int().positive(),
  outCoreNo: z.number().int().min(1).max(12),
  type: SpliceTypeSchema,
  lossDb: z.number().nonnegative(),
})

export const ClosureListSchema = z.object({
  items: z.array(ClosureSchema),
  total: z.number().int().nonnegative(),
})
export const SpliceListSchema = z.object({
  items: z.array(SpliceSchema),
  total: z.number().int().nonnegative(),
})

export const CreateClosureSchema = ClosureSchema.omit({ id: true })
export const CreateSpliceSchema = SpliceSchema.omit({ id: true })

export type ClosureType = z.infer<typeof ClosureTypeSchema>
export type Closure = z.infer<typeof ClosureSchema>
export type SpliceType = z.infer<typeof SpliceTypeSchema>
export type Splice = z.infer<typeof SpliceSchema>
export type ClosureList = z.infer<typeof ClosureListSchema>
export type SpliceList = z.infer<typeof SpliceListSchema>
export type CreateClosureInput = z.infer<typeof CreateClosureSchema>
export type CreateSpliceInput = z.infer<typeof CreateSpliceSchema>

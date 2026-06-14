import { z } from 'zod'

// A geographic point shared by cabling entities (cable routes, etc.).
export const LatLngSchema = z.object({ lat: z.number(), lng: z.number() })

// A fiber cable run between two topology nodes. `kind` follows the FTTH tiers:
// feeder (OLT→ODC), distribution (ODC→ODP), drop (ODP/pole→customer). Edges on
// the map are still derived from NetworkNode.parentId; a Cable adds the physical
// facts (spec, fiber/tube count, surveyed length) the logical tree can't carry.
export const CableKindSchema = z.enum(['feeder', 'distribution', 'drop'])
export const CableStatusSchema = z.enum(['planned', 'installed', 'retired'])

export const CableSchema = z.object({
  id: z.string().min(1),
  kind: CableKindSchema,
  spec: z.string().min(1), // e.g. "G.652D 12F loose-tube"
  fiberCount: z.number().int().positive(),
  tubeCount: z.number().int().positive(),
  fromNodeId: z.string().min(1), // upstream NetworkNode id
  toNodeId: z.string().min(1), // downstream NetworkNode id
  route: z.array(LatLngSchema), // waypoints; [] ⇒ straight from→to
  lengthM: z.number().nonnegative(), // surveyed/as-built length (m)
  status: CableStatusSchema,
  installedAt: z.iso.datetime().nullable(),
})

// One strand (fiber) within a cable, identified by tube + core (TIA-598). Only
// non-spare strands are stored; spares are derived (fiberCount − allocated).
export const StrandStatusSchema = z.enum(['allocated', 'reserved', 'dead'])
export const StrandAssignmentSchema = z.object({
  id: z.string().min(1),
  cableId: z.string().min(1),
  tubeNo: z.number().int().positive(),
  coreNo: z.number().int().min(1).max(12),
  status: StrandStatusSchema,
  circuitId: z.string().min(1).nullable(),
  customerId: z.string().min(1).nullable(),
})

export const CableListSchema = z.object({
  items: z.array(CableSchema),
  total: z.number().int().nonnegative(),
})
export const StrandListSchema = z.object({
  items: z.array(StrandAssignmentSchema),
  total: z.number().int().nonnegative(),
})

export const CreateCableSchema = CableSchema.omit({ id: true })
export const UpdateCableSchema = CreateCableSchema.partial()
export const CreateStrandSchema = StrandAssignmentSchema.omit({ id: true })

export type LatLng = z.infer<typeof LatLngSchema>
export type CableKind = z.infer<typeof CableKindSchema>
export type CableStatus = z.infer<typeof CableStatusSchema>
export type Cable = z.infer<typeof CableSchema>
export type StrandStatus = z.infer<typeof StrandStatusSchema>
export type StrandAssignment = z.infer<typeof StrandAssignmentSchema>
export type CableList = z.infer<typeof CableListSchema>
export type StrandList = z.infer<typeof StrandListSchema>
export type CreateCableInput = z.infer<typeof CreateCableSchema>
export type UpdateCableInput = z.infer<typeof UpdateCableSchema>
export type CreateStrandInput = z.infer<typeof CreateStrandSchema>

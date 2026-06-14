import { z } from 'zod'

// An end-to-end customer optical circuit: OLT PON port → (ODC splitter → ODP
// splitter) → drop strand → ONU. The ordered physical "hops" are computed at
// render time from the cables/splitters (see traceCircuit) rather than persisted,
// so there is a single source of truth.
export const CircuitStatusSchema = z.enum(['active', 'planned', 'down'])

export const CircuitSchema = z.object({
  id: z.string().min(1),
  customerId: z.string().min(1),
  customerNodeId: z.string().min(1), // `${customerId}-node`
  oltNodeId: z.string().min(1),
  oltPonPort: z.string().min(1), // "0/1/1"
  onuSerial: z.string().min(1).nullable(),
  status: CircuitStatusSchema,
})

export const CircuitListSchema = z.object({
  items: z.array(CircuitSchema),
  total: z.number().int().nonnegative(),
})

export const CreateCircuitSchema = CircuitSchema.omit({ id: true })

export type CircuitStatus = z.infer<typeof CircuitStatusSchema>
export type Circuit = z.infer<typeof CircuitSchema>
export type CircuitList = z.infer<typeof CircuitListSchema>
export type CreateCircuitInput = z.infer<typeof CreateCircuitSchema>

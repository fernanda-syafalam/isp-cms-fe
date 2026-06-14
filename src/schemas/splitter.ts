import { z } from 'zod'

// A PON optical splitter component living on an ODC (1:4) or ODP (1:8) node. It
// is the unit of capacity: one output port → one downstream node (an ODP feeder
// for an ODC splitter, or a customer drop for an ODP splitter). `portsUsed` on
// the projected node meta is derived from the occupied ports here (see
// features/topology/lib/projection.ts) — never hand-maintained.
export const SplitterRatioSchema = z.enum(['1:2', '1:4', '1:8', '1:16', '1:32', '1:64'])

export const SplitterPortSchema = z.object({
  portNo: z.number().int().positive(), // 1..ratioCount
  outNodeId: z.string().min(1).nullable(), // downstream node (ODP or customer); null = free
  customerId: z.string().min(1).nullable(),
  strandId: z.string().min(1).nullable(),
})

export const SplitterSchema = z.object({
  id: z.string().min(1),
  nodeId: z.string().min(1), // host ODC/ODP NetworkNode
  ratio: SplitterRatioSchema,
  inCableId: z.string().min(1).nullable(), // upstream feeder/distribution cable
  inStrandId: z.string().min(1).nullable(),
  ports: z.array(SplitterPortSchema), // length === ratioCount(ratio)
})

export const SplitterListSchema = z.object({
  items: z.array(SplitterSchema),
  total: z.number().int().nonnegative(),
})

export const CreateSplitterSchema = SplitterSchema.omit({ id: true })
export const UpdateSplitterSchema = CreateSplitterSchema.partial()

export type SplitterRatio = z.infer<typeof SplitterRatioSchema>
export type SplitterPort = z.infer<typeof SplitterPortSchema>
export type Splitter = z.infer<typeof SplitterSchema>
export type SplitterList = z.infer<typeof SplitterListSchema>
export type CreateSplitterInput = z.infer<typeof CreateSplitterSchema>
export type UpdateSplitterInput = z.infer<typeof UpdateSplitterSchema>

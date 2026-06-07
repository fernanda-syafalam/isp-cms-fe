import { z } from 'zod'

// Network topology node. The physical chain is OLT → ODC → ODP → pole →
// customer, expressed as a parent link (`parentId`) on each node; edges are
// derived from those links. Self-contained mock dataset (not the Customer
// schema) — see ADR-0004.
export const NodeTypeSchema = z.enum(['olt', 'odc', 'odp', 'pole', 'customer'])
export const NodeStatusSchema = z.enum(['up', 'down', 'unknown'])

// Type-specific technical metadata (all optional; populated per node type).
export const NodeMetaSchema = z.object({
  ipAddress: z.string().optional(), // OLT/ODC management IP
  model: z.string().optional(), // hardware model (OLT)
  splitter: z.string().optional(), // splitter ratio (ODC/ODP), e.g. "1:8"
  portsUsed: z.number().int().nonnegative().optional(),
  portsTotal: z.number().int().positive().optional(),
  rxPowerDbm: z.number().optional(), // optical RX power (ODP/customer)
  uptimePct: z.number().optional(),
  customerId: z.string().optional(), // link a customer node to its record
  planName: z.string().optional(),
})

export const NetworkNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: NodeTypeSchema,
  status: NodeStatusSchema,
  lat: z.number(),
  lng: z.number(),
  parentId: z.string().nullable(), // uplink node id; null at the OLT root
  meta: NodeMetaSchema.optional(),
})

export const TopologySchema = z.object({
  items: z.array(NetworkNodeSchema),
  total: z.number().int().nonnegative(),
})

export const CreateNodeSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(120),
  type: NodeTypeSchema,
  status: NodeStatusSchema,
  parentId: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
})

export const UpdateNodeSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(120).optional(),
  type: NodeTypeSchema.optional(),
  status: NodeStatusSchema.optional(),
  parentId: z.string().nullable().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
})

export type NodeType = z.infer<typeof NodeTypeSchema>
export type NodeStatus = z.infer<typeof NodeStatusSchema>
export type NodeMeta = z.infer<typeof NodeMetaSchema>
export type NetworkNode = z.infer<typeof NetworkNodeSchema>
export type Topology = z.infer<typeof TopologySchema>
export type CreateNodeInput = z.infer<typeof CreateNodeSchema>
export type UpdateNodeInput = z.infer<typeof UpdateNodeSchema>

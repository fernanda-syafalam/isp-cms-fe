import { z } from 'zod'

// Network topology node. The physical chain is OLT → ODC → ODP → pole →
// customer, expressed as a parent link (`parentId`) on each node; edges are
// derived from those links. Self-contained mock dataset (not the Customer
// schema) — see ADR-0004.
export const NodeTypeSchema = z.enum(['olt', 'odc', 'odp', 'pole', 'customer'])
export const NodeStatusSchema = z.enum(['up', 'down', 'unknown'])

export const NetworkNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: NodeTypeSchema,
  status: NodeStatusSchema,
  lat: z.number(),
  lng: z.number(),
  parentId: z.string().nullable(), // uplink node id; null at the OLT root
})

export const TopologySchema = z.object({
  items: z.array(NetworkNodeSchema),
  total: z.number().int().nonnegative(),
})

export type NodeType = z.infer<typeof NodeTypeSchema>
export type NodeStatus = z.infer<typeof NodeStatusSchema>
export type NetworkNode = z.infer<typeof NetworkNodeSchema>
export type Topology = z.infer<typeof TopologySchema>

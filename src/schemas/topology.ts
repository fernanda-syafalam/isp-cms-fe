import { z } from 'zod'

import { SplitterRatioSchema } from './splitter'

// Network topology node. The physical chain is OLT → ODC → ODP → pole →
// customer, expressed as a parent link (`parentId`) on each node; edges are
// derived from those links. Self-contained mock dataset (not the Customer
// schema) — see ADR-0004.
export const NodeTypeSchema = z.enum(['olt', 'odc', 'odp', 'pole', 'customer'])
// NETWORK/optical status — this is what the map color means (online / LOS /
// unknown), NOT billing. A suspended (isolir) customer is optically `up`.
export const NodeStatusSchema = z.enum(['up', 'down', 'unknown'])
// Billing/service lifecycle of a customer node, kept separate from the network
// status so "belum bayar" (isolir) is never mistaken for "fiber putus" (down).
export const NodeLifecycleSchema = z.enum(['prospek', 'instalasi', 'aktif', 'isolir', 'berhenti'])

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
  coreNo: z.number().int().positive().optional(), // fiber core feeding a customer (TIA-598)
  onuSerial: z.string().optional(), // ONU serial — match the physical unit on-site
  ponPort: z.string().optional(), // OLT PON port feeding this customer (e.g. "0/1/1")
  phone: z.string().optional(), // customer phone for tap-to-call / WhatsApp in the field
  lifecycle: NodeLifecycleSchema.optional(), // billing/service state (≠ network status)
  maintenance: z.boolean().optional(), // under planned work — suppressed from fault alarms
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

// Infra directives accepted on create/update: splitterRatio provisions/updates
// an ODC/ODP's splitter (capacity); ipAddress/model are OLT/ODC node facts. They
// are NOT customer fields — a customer is created via the install flow, never
// this generic schema.
const InfraFieldsSchema = z.object({
  splitterRatio: SplitterRatioSchema.optional(),
  ipAddress: z.string().optional(),
  model: z.string().optional(),
  maintenance: z.boolean().optional(), // toggle planned-work state
})

export const CreateNodeSchema = z
  .object({
    name: z.string().min(1, 'Nama wajib diisi').max(120),
    type: NodeTypeSchema,
    status: NodeStatusSchema,
    parentId: z.string().nullable(),
    lat: z.number(),
    lng: z.number(),
  })
  .extend(InfraFieldsSchema.shape)

export const UpdateNodeSchema = z
  .object({
    name: z.string().min(1, 'Nama wajib diisi').max(120).optional(),
    type: NodeTypeSchema.optional(),
    status: NodeStatusSchema.optional(),
    parentId: z.string().nullable().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  })
  .extend(InfraFieldsSchema.shape)

export type NodeType = z.infer<typeof NodeTypeSchema>
export type NodeStatus = z.infer<typeof NodeStatusSchema>
export type NodeLifecycle = z.infer<typeof NodeLifecycleSchema>
export type NodeMeta = z.infer<typeof NodeMetaSchema>
export type NetworkNode = z.infer<typeof NetworkNodeSchema>
export type Topology = z.infer<typeof TopologySchema>
export type CreateNodeInput = z.infer<typeof CreateNodeSchema>
export type UpdateNodeInput = z.infer<typeof UpdateNodeSchema>

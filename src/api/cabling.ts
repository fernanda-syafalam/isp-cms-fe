import {
  type Cable,
  type CableList,
  CableListSchema,
  CableSchema,
  type CreateCableInput,
  type CustomerDropInput,
  type StrandList,
  StrandListSchema,
  type UpdateCableRouteInput,
} from '@/schemas/cable'
import { type CircuitList, CircuitListSchema } from '@/schemas/circuit'
import { type NetworkNode, NetworkNodeSchema } from '@/schemas/topology'
import {
  type Closure,
  type ClosureList,
  ClosureListSchema,
  ClosureSchema,
  type CreateClosureInput,
  type CreateSpliceInput,
  type Splice,
  SpliceSchema,
  type SpliceList,
  SpliceListSchema,
} from '@/schemas/closure'
import { type SplitterList, SplitterListSchema } from '@/schemas/splitter'

import { api } from './client'

// Read endpoints for the OSP cabling layer. The physical entities are the source
// of truth; the map projects node.meta from them. Validate every response at the
// boundary (ADR-0003). Mutations happen via the install flow + node form, not
// raw per-entity writes — so only reads are exposed here.
export async function listCables(): Promise<CableList> {
  return CableListSchema.parse(await api.get('cables').json())
}

export async function listStrands(): Promise<StrandList> {
  return StrandListSchema.parse(await api.get('strands').json())
}

export async function listClosures(): Promise<ClosureList> {
  return ClosureListSchema.parse(await api.get('closures').json())
}

export async function listSplices(): Promise<SpliceList> {
  return SpliceListSchema.parse(await api.get('splices').json())
}

export async function listSplitters(): Promise<SplitterList> {
  return SplitterListSchema.parse(await api.get('splitters').json())
}

export async function listCircuits(): Promise<CircuitList> {
  return CircuitListSchema.parse(await api.get('circuits').json())
}

// Provision a subscriber's drop on the target ODP; returns the new customer node.
export async function installCustomerDrop(input: CustomerDropInput): Promise<NetworkNode> {
  return NetworkNodeSchema.parse(await api.post('topology/customer-drop', { json: input }).json())
}

// Replace a cable's surveyed route; the server recomputes lengthM.
export async function updateCableRoute(id: string, input: UpdateCableRouteInput): Promise<Cable> {
  return CableSchema.parse(await api.patch(`cables/${id}`, { json: input }).json())
}

// Record a new physical cable run between two nodes. An empty route means a
// straight line from→to; the server recomputes lengthM when a route is given.
export async function createCable(input: CreateCableInput): Promise<Cable> {
  return CableSchema.parse(await api.post('cables', { json: input }).json())
}

// Add a splice closure (joint enclosure) co-located with an ODC/ODP node.
export async function createClosure(input: CreateClosureInput): Promise<Closure> {
  return ClosureSchema.parse(await api.post('closures', { json: input }).json())
}

// Record a new fusion/mechanical splice inside a closure (a feeder→drop joint).
export async function createSplice(input: CreateSpliceInput): Promise<Splice> {
  return SpliceSchema.parse(await api.post('splices', { json: input }).json())
}

// Remove a splice from its closure.
export async function deleteSplice(id: string): Promise<void> {
  await api.delete(`splices/${id}`)
}

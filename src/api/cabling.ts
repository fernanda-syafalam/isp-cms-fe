import { type CableList, CableListSchema, type StrandList, StrandListSchema } from '@/schemas/cable'
import { type CircuitList, CircuitListSchema } from '@/schemas/circuit'
import {
  type ClosureList,
  ClosureListSchema,
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

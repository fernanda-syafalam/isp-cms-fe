// Derives the OSP cabling layer (splitters, strands, drop cables, circuits,
// closures) FROM the existing topology nodes, so the physical layer and the node
// graph are consistent by construction. Kept out of handlers.ts (already large);
// handlers.ts calls deriveCabling() after building TOPOLOGY_FIXTURES, then
// registers the returned arrays as live MSW collections. allocateDrop/freeDrop
// are the single capacity mutators shared by onboarding and the install flow.

import {
  fiberId,
  indexById,
  ratioCount,
  segmentMeters,
  uplinkPath,
} from '@/features/topology/lib/graph'
import type { Cable, StrandAssignment } from '@/schemas/cable'
import type { Circuit } from '@/schemas/circuit'
import type { Closure } from '@/schemas/closure'
import type { Splitter, SplitterRatio } from '@/schemas/splitter'
import type { NetworkNode } from '@/schemas/topology'

type Point = { id: string; lat: number; lng: number }

export type CablingStore = {
  cables: Cable[]
  strands: StrandAssignment[]
  splitters: Splitter[]
  closures: Closure[]
  splices: never[] // splice fixtures are a deferred OSP phase (schema exists)
  circuits: Circuit[]
}

const splitterRatioFor = (type: NetworkNode['type']): SplitterRatio =>
  type === 'odc' ? '1:4' : '1:8'

// First ODP on a node's uplink (customers may hang off a pole under the ODP).
function servingOdp(node: NetworkNode, byId: Map<string, NetworkNode>): NetworkNode | undefined {
  return uplinkPath(node, byId).find((n) => n.type === 'odp')
}

function oltOf(node: NetworkNode, byId: Map<string, NetworkNode>): NetworkNode | undefined {
  return uplinkPath(node, byId).find((n) => n.type === 'olt')
}

function dropCable(from: Point, to: Point, id: string, planned: boolean): Cable {
  return {
    id,
    kind: 'drop',
    spec: 'G.652D 12F drop',
    fiberCount: 12,
    tubeCount: 1,
    fromNodeId: from.id,
    toNodeId: to.id,
    route: [
      { lat: from.lat, lng: from.lng },
      { lat: to.lat, lng: to.lng },
    ],
    lengthM: segmentMeters(from, to),
    status: planned ? 'planned' : 'installed',
    installedAt: null,
  }
}

export function deriveCabling(nodes: NetworkNode[]): CablingStore {
  const byId = indexById(nodes)
  const splitters: Splitter[] = []
  const closures: Closure[] = []
  const cables: Cable[] = []
  const strands: StrandAssignment[] = []
  const circuits: Circuit[] = []

  // A splitter + closure on every ODC (1:4) and ODP (1:8).
  for (const n of nodes) {
    if (n.type !== 'odc' && n.type !== 'odp') continue
    const ratio = splitterRatioFor(n.type)
    const count = ratioCount(ratio)
    splitters.push({
      id: `${n.id}-splitter`,
      nodeId: n.id,
      ratio,
      inCableId: null,
      inStrandId: null,
      ports: Array.from({ length: count }, (_, i) => ({
        portNo: i + 1,
        outNodeId: null,
        customerId: null,
        strandId: null,
      })),
    })
    closures.push({
      id: `${n.id}-closure`,
      type: n.type === 'odc' ? 'odc' : 'odp',
      nodeId: n.id,
      trayCapacity: Math.max(1, Math.ceil(count / 12)),
      fiberCapacity: count,
    })
  }
  const splitterByNode = new Map(splitters.map((s) => [s.nodeId, s]))

  // ODC splitter ports feed ODP children (distribution tier).
  for (const n of nodes) {
    if (n.type !== 'odp' || !n.parentId) continue
    const odc = byId.get(n.parentId)
    if (odc?.type !== 'odc') continue
    const port = splitterByNode.get(odc.id)?.ports.find((p) => p.outNodeId === null)
    if (port) port.outNodeId = n.id
  }

  // Each customer drop: strand (tube/core from its existing coreNo so colors are
  // preserved) + drop cable + circuit + an ODP splitter port.
  for (const n of nodes) {
    if (n.type !== 'customer') continue
    const customerId = n.meta?.customerId
    const odp = servingOdp(n, byId)
    if (!customerId || !odp) continue // tolerate orphan customers
    const splitter = splitterByNode.get(odp.id)
    const port = splitter?.ports.find((p) => p.outNodeId === null)
    if (!port) continue // overflow: ODP splitter full — skip this drop

    const fid = fiberId(n.meta?.coreNo ?? port.portNo)
    const cableId = `${n.id}-drop`
    const strandId = `${n.id}-strand`
    const circuitId = `${customerId}-circuit`
    cables.push(dropCable(odp, n, cableId, n.status === 'unknown'))
    strands.push({
      id: strandId,
      cableId,
      tubeNo: fid.tubeNo,
      coreNo: fid.coreNo,
      status: n.status === 'down' ? 'dead' : 'allocated',
      circuitId,
      customerId,
    })
    circuits.push({
      id: circuitId,
      customerId,
      customerNodeId: n.id,
      oltNodeId: oltOf(n, byId)?.id ?? odp.id,
      oltPonPort: n.meta?.ponPort ?? '0/0/0',
      onuSerial: n.meta?.onuSerial ?? null,
      status: n.status === 'down' ? 'down' : 'active',
    })
    port.outNodeId = n.id
    port.customerId = customerId
    port.strandId = strandId
  }

  return { cables, strands, splitters, closures, splices: [], circuits }
}

const uuid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Math.round(performance.now() * 1000)}`

// Allocate a drop for a customer on a free ODP splitter port. Mutates the store
// in place (new cable + strand + circuit, port bound). Returns the assigned
// fiber core (= the port number; tube 1) for the customer node's meta, or null
// when the ODP splitter is full. The single allocation path for onboarding and
// the install flow.
export function allocateDrop(
  store: CablingStore,
  nodes: NetworkNode[],
  odp: NetworkNode,
  customer: Point & { customerId: string },
  conn: {
    ponPort?: string | null | undefined
    onuSerial?: string | null | undefined
  },
  // When set, allocate this exact splitter port (= fiber core the technician
  // picked); otherwise take the first free port. Returns null if it is taken.
  portNo?: number | undefined,
): { coreNo: number } | null {
  const splitter = store.splitters.find((s) => s.nodeId === odp.id)
  const port =
    portNo != null
      ? splitter?.ports.find((p) => p.portNo === portNo && p.outNodeId === null)
      : splitter?.ports.find((p) => p.outNodeId === null)
  if (!splitter || !port) return null

  const cableId = uuid()
  const strandId = uuid()
  const circuitId = uuid()
  store.cables.push(dropCable(odp, customer, cableId, false))
  store.strands.push({
    id: strandId,
    cableId,
    tubeNo: 1,
    coreNo: port.portNo,
    status: 'allocated',
    circuitId,
    customerId: customer.customerId,
  })
  store.circuits.push({
    id: circuitId,
    customerId: customer.customerId,
    customerNodeId: customer.id,
    oltNodeId: oltOf(odp, indexById(nodes))?.id ?? odp.id,
    oltPonPort: conn.ponPort ?? '0/0/0',
    onuSerial: conn.onuSerial ?? null,
    status: 'active',
  })
  port.outNodeId = customer.id
  port.customerId = customer.customerId
  port.strandId = strandId
  return { coreNo: port.portNo }
}

// Reverse of allocateDrop: free everything a customer's drop occupies, mutating
// the live arrays IN PLACE (splice, not reassign — COLLECTIONS holds them by
// reference). No-ops gracefully if rows are absent. Used by the DELETE cascade.
export function freeDrop(store: CablingStore, customerId: string, customerNodeId: string): void {
  for (const s of store.splitters) {
    for (const p of s.ports) {
      if (p.customerId === customerId || p.outNodeId === customerNodeId) {
        p.outNodeId = null
        p.customerId = null
        p.strandId = null
      }
    }
  }
  spliceOut(store.cables, (c) => c.toNodeId === customerNodeId)
  spliceOut(store.strands, (s) => s.customerId === customerId)
  spliceOut(store.circuits, (c) => c.customerId === customerId)
}

function spliceOut<T>(arr: T[], match: (item: T) => boolean): void {
  for (let i = arr.length - 1; i >= 0; i--) {
    const item = arr[i]
    if (item !== undefined && match(item)) arr.splice(i, 1)
  }
}

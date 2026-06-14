import type { NetworkNode, NodeStatus, NodeType } from '@/schemas/topology'

export const TYPE_LABEL: Record<NodeType, string> = {
  olt: 'OLT',
  odc: 'ODC',
  odp: 'ODP',
  pole: 'Tiang',
  customer: 'Pelanggan',
}

// Marker radius per type — larger upstream, smaller toward the edge.
export const TYPE_RADIUS: Record<NodeType, number> = {
  olt: 9,
  odc: 8,
  odp: 7,
  pole: 5,
  customer: 6,
}

export const STATUS_LABEL: Record<NodeStatus, string> = {
  up: 'Up',
  down: 'Down',
  unknown: 'Unknown',
}

// oklch-free hex so Leaflet SVG paths render identically in both themes.
export const STATUS_COLOR: Record<NodeStatus, string> = {
  up: '#16a34a',
  down: '#dc2626',
  unknown: '#d97706',
}

// Billing-suspended (isolir) / disconnected (berhenti) customers render slate —
// distinct from green/red/amber so a tech reads "ditangguhkan, bukan gangguan"
// (suspended, not a fault) at a glance. Network status stays the source of truth
// for the chain; this only recolors the customer marker.
export const SUSPEND_COLOR = '#475569'

// Nodes under planned maintenance render sky-blue — "kerja terjadwal, bukan
// gangguan" — so planned work is never mistaken for an outage. Overrides the
// status/suspend color on the marker.
export const MAINTENANCE_COLOR = '#0ea5e9'

// Fiber core color code (TIA-598-C) — each core/strand in a cable has a distinct
// color; one core feeds one customer. Beyond 12, the sequence repeats (striped).
// Ref: TIA-598-C / FOA. Names in Indonesian for the UI.
export const FIBER_CORES = [
  { name: 'Biru', hex: '#2563eb' },
  { name: 'Oranye', hex: '#ea580c' },
  { name: 'Hijau', hex: '#16a34a' },
  { name: 'Coklat', hex: '#92400e' },
  { name: 'Abu-abu', hex: '#6b7280' },
  { name: 'Putih', hex: '#d1d5db' },
  { name: 'Merah', hex: '#dc2626' },
  { name: 'Hitam', hex: '#111827' },
  { name: 'Kuning', hex: '#eab308' },
  { name: 'Ungu', hex: '#7c3aed' },
  { name: 'Merah Muda', hex: '#ec4899' },
  { name: 'Aqua', hex: '#06b6d4' },
] as const

// Map a 1-based core number to its TIA-598 color (cycles every 12).
export function fiberCore(coreNo: number): { name: string; hex: string } {
  return FIBER_CORES[(coreNo - 1) % 12] ?? FIBER_CORES[0]
}

// A loose-tube cable groups fibers into buffer tubes of 12. A global fiber
// number resolves to its tube (color) + position within that tube (color) — the
// standard "tube + core" identity used to trace a strand. (TIA-598-C.)
export function fiberId(globalNo: number): {
  tubeNo: number
  tube: { name: string; hex: string }
  coreNo: number
  core: { name: string; hex: string }
} {
  const tubeNo = Math.ceil(globalNo / 12)
  const inTube = ((globalNo - 1) % 12) + 1
  return {
    tubeNo,
    tube: fiberCore(tubeNo),
    coreNo: inTube,
    core: fiberCore(inTube),
  }
}

export function indexById(nodes: NetworkNode[]): Map<string, NetworkNode> {
  return new Map(nodes.map((n) => [n.id, n]))
}

// Haversine distance (m) between two coordinates — the physical cable length of
// the segment between a node and its uplink.
export function segmentMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6_371_000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const la1 = (a.lat * Math.PI) / 180
  const la2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(h)))
}

export function formatLength(meters: number): string {
  return meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(2)} km`
}

// Total length (m) of a polyline route — the sum of its consecutive segments.
// A surveyed cable route bends around poles/roads, so its real length is longer
// than the straight from→to. Returns 0 for fewer than two points.
export function routeLength(points: Array<{ lat: number; lng: number }>): number {
  let total = 0
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    if (a && b) total += segmentMeters(a, b)
  }
  return total
}

// Lowercased haystack for searching a node: its name + id plus the meta facts a
// technician is likely to have in hand — the customer's phone or ONU serial off
// a support call, an OLT/ODC IP, the PON port, the plan. So "find this customer"
// works from whatever identifier is at hand, not just the node name.
export function nodeSearchText(n: NetworkNode): string {
  const m = n.meta
  return [
    n.name,
    n.id,
    m?.phone,
    m?.onuSerial,
    m?.ipAddress,
    m?.ponPort,
    m?.planName,
    m?.customerId,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

// Why a node matched a query (for the result subtitle): the first meta field
// whose value contains the query, labelled. Null when it matched only the name.
export function matchedField(n: NetworkNode, query: string): string | null {
  const q = query.trim().toLowerCase()
  if (!q) return null
  const m = n.meta
  const fields: Array<[string, string | undefined]> = [
    ['Telepon', m?.phone],
    ['ONU', m?.onuSerial],
    ['IP', m?.ipAddress],
    ['PON', m?.ponPort],
    ['Paket', m?.planName],
  ]
  for (const [label, value] of fields) {
    if (value?.toLowerCase().includes(q)) return `${label}: ${value}`
  }
  return null
}

export type OdpCapacity = {
  node: NetworkNode
  used: number
  total: number
  pct: number
}

// ODPs at or above `minPct` port occupancy, fullest first — the capacity-
// planning question "where am I about to run out of ports?" so ops can add a
// splitter/ODP before the next install is rejected.
export function nearFullOdps(nodes: NetworkNode[], minPct = 70): OdpCapacity[] {
  const out: OdpCapacity[] = []
  for (const n of nodes) {
    if (n.type !== 'odp') continue
    const total = n.meta?.portsTotal
    if (!total) continue
    const used = n.meta?.portsUsed ?? 0
    const pct = Math.round((used / total) * 100)
    if (pct >= minPct) out.push({ node: n, used, total, pct })
  }
  return out.sort((a, b) => b.pct - a.pct)
}

// Nearest ODP that still has a free port, by straight-line distance from a
// point (the technician's location). The answer to "where can I hook up this
// new customer from here?" — returns null if every ODP is full or none exist.
export function nearestFreeOdp(
  from: { lat: number; lng: number },
  nodes: NetworkNode[],
): { node: NetworkNode; meters: number } | null {
  let best: { node: NetworkNode; meters: number } | null = null
  for (const n of nodes) {
    if (n.type !== 'odp') continue
    const total = n.meta?.portsTotal
    if (!total || (n.meta?.portsUsed ?? 0) >= total) continue
    const meters = segmentMeters(from, n)
    if (!best || meters < best.meters) best = { node: n, meters }
  }
  return best
}

// GPON optical link budget (Class B+ = 28 dB). Typical values (ITU-T G.984 /
// FOA): SMF ~0.35 dB/km @1490nm, connector ~0.5 dB, splice ~0.1 dB, and PON
// splitter insertion loss per ratio. We estimate end-to-end loss along a node's
// uplink so a technician can see if it's within budget.
const FIBER_DB_PER_KM = 0.35
const CONNECTOR_DB = 0.5
const SPLICE_DB = 0.1 // fusion splice loss per joint (one per ODC/ODP closure)
const GPON_BUDGET_DB = 28 // Class B+
// GPON downstream launch power at the OLT (typ. Class B+, ITU-T G.984). Used to
// predict the ONU RX power from the cumulative loss.
const OLT_TX_DBM = 3
// ONU receiver window (Class B+): above the overload point the receiver
// saturates (too hot — also a fault); below sensitivity the link drops (LOS).
const RX_OVERLOAD_DBM = -8
const RX_SENSITIVITY_DBM = -27
const SPLITTER_LOSS_DB: Record<string, number> = {
  '1:2': 3.5,
  '1:4': 7.2,
  '1:8': 10.5,
  '1:16': 14,
  '1:32': 17.5,
  '1:64': 21,
}

// Output-port count of a PON splitter ratio: "1:8" → 8. The capacity of an
// ODC/ODP, derived from its splitter rather than hand-set.
export function ratioCount(ratio: string): number {
  const n = Number(ratio.split(':')[1])
  return Number.isFinite(n) && n > 0 ? n : 0
}

export type LinkBudget = {
  lossDb: number
  budgetDb: number
  marginDb: number
  // OLT_TX − loss: the RX power we EXPECT at this node. Compare to the ONU's
  // measured reading to spot a fault the budget can't see (dirty connector,
  // macrobend, bad splice on the drop).
  predictedRxDbm: number
}

// Estimated cumulative optical loss from the OLT down to `node`: fiber distance
// loss over every uplink segment + each splitter (ODC/ODP) + a connector at
// each passive joint (ODC, ODP, ONT) and at the OLT + a fusion splice at each
// closure (ODC/ODP).
export function linkBudget(node: NetworkNode, byId: Map<string, NetworkNode>): LinkBudget {
  const path = uplinkPath(node, byId) // node → … → OLT
  let loss = CONNECTOR_DB // OLT/ODF patch
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i]
    const b = path[i + 1]
    if (a && b) loss += (segmentMeters(a, b) / 1000) * FIBER_DB_PER_KM
  }
  for (const p of path) {
    if (p.meta?.splitter) loss += SPLITTER_LOSS_DB[p.meta.splitter] ?? 0
    if (p.type === 'odc' || p.type === 'odp') loss += CONNECTOR_DB + SPLICE_DB
    if (p.type === 'customer') loss += CONNECTOR_DB
  }
  const lossDb = Math.round(loss * 10) / 10
  return {
    lossDb,
    budgetDb: GPON_BUDGET_DB,
    marginDb: Math.round((GPON_BUDGET_DB - loss) * 10) / 10,
    predictedRxDbm: Math.round((OLT_TX_DBM - loss) * 10) / 10,
  }
}

export type RxHealth = 'overload' | 'good' | 'marginal' | 'critical'

// Classify an ONU's measured RX power against the GPON receiver window. Above
// the overload point the receiver is saturated (too hot — install an
// attenuator); below sensitivity the link is failing (LOS). 'good' keeps a few
// dB of headroom; 'marginal' is the last stretch before sensitivity.
export function rxHealth(dbm: number): RxHealth {
  if (dbm > RX_OVERLOAD_DBM) return 'overload'
  if (dbm >= -25) return 'good'
  if (dbm >= RX_SENSITIVITY_DBM) return 'marginal'
  return 'critical'
}

// Tree node for the accessible list/hierarchy view (alternative to the map —
// network graphs are poor for a11y, so we expose the same data as a tree).
export type TreeNode = { node: NetworkNode; children: TreeNode[] }

const TYPE_ORDER: NodeType[] = ['olt', 'odc', 'odp', 'pole', 'customer']

// Build the OLT→…→customer forest from parentId links. Roots = nodes with no
// parent present in the given set. Children sorted by type then name.
export function buildForest(nodes: NetworkNode[]): TreeNode[] {
  const byId = indexById(nodes)
  const childrenOf = new Map<string, NetworkNode[]>()
  const roots: NetworkNode[] = []
  for (const n of nodes) {
    const parent = n.parentId ? byId.get(n.parentId) : undefined
    if (parent) {
      const list = childrenOf.get(parent.id) ?? []
      list.push(n)
      childrenOf.set(parent.id, list)
    } else {
      roots.push(n)
    }
  }
  const sortNodes = (a: NetworkNode, b: NetworkNode) =>
    TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) || a.name.localeCompare(b.name)
  const build = (n: NetworkNode): TreeNode => ({
    node: n,
    children: (childrenOf.get(n.id) ?? []).sort(sortNodes).map(build),
  })
  return roots.sort(sortNodes).map(build)
}

// Uplink path from a node up to the OLT root (inclusive), nearest first.
export function uplinkPath(start: NetworkNode, byId: Map<string, NetworkNode>): NetworkNode[] {
  const path: NetworkNode[] = [start]
  const seen = new Set<string>([start.id])
  let current = start
  while (current.parentId) {
    const parent = byId.get(current.parentId)
    if (!parent || seen.has(parent.id)) break
    path.push(parent)
    seen.add(parent.id)
    current = parent
  }
  return path
}

export type CircuitTrace = { pathIds: Set<string>; coreHex: string | null }

// Trace a customer's end-to-end circuit: the node ids along its uplink (the
// physical path customer→ODP→ODC→OLT) plus the TIA-598 colour of the fiber core
// that serves it. `coreHex` is null for a non-customer (or a customer with no
// assigned core), so the caller falls back to the plain selection accent.
export function traceCircuit(node: NetworkNode, byId: Map<string, NetworkNode>): CircuitTrace {
  const pathIds = new Set(uplinkPath(node, byId).map((n) => n.id))
  const coreHex =
    node.type === 'customer' && node.meta?.coreNo ? fiberCore(node.meta.coreNo).hex : null
  return { pathIds, coreHex }
}

// All descendants of a node (its downstream subtree), by parentId links.
export function downstreamIds(rootId: string, nodes: NetworkNode[]): Set<string> {
  const childrenOf = new Map<string, string[]>()
  for (const n of nodes) {
    if (n.parentId) {
      const list = childrenOf.get(n.parentId) ?? []
      list.push(n.id)
      childrenOf.set(n.parentId, list)
    }
  }
  const result = new Set<string>()
  const stack = [rootId]
  while (stack.length) {
    const id = stack.pop()
    if (id === undefined) continue
    for (const child of childrenOf.get(id) ?? []) {
      if (!result.has(child)) {
        result.add(child)
        stack.push(child)
      }
    }
  }
  return result
}

// Customers cut off by an outage (blast radius): any customer that is itself
// down, or whose uplink passes through a down node (downstream of it).
export function impactedCustomerIds(nodes: NetworkNode[]): Set<string> {
  const byId = indexById(nodes)
  const ids = new Set<string>()
  for (const d of nodes) {
    if (d.status !== 'down') continue
    if (d.type === 'customer') ids.add(d.id)
    for (const id of downstreamIds(d.id, nodes)) {
      if (byId.get(id)?.type === 'customer') ids.add(id)
    }
  }
  return ids
}

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

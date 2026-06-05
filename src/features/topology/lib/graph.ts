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

export function indexById(nodes: NetworkNode[]): Map<string, NetworkNode> {
  return new Map(nodes.map((n) => [n.id, n]))
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

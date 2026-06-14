import type { NetworkNode } from '@/schemas/topology'

export type Cluster = {
  lat: number
  lng: number
  ids: string[]
  count: number
  hasDown: boolean
}

// Grid-cluster nodes into cells of `cellDeg` degrees: a cell with 2+ nodes
// becomes a cluster (centroid + count + any-down flag); lone nodes pass through
// as singles. Dependency-free, so a dense network stays readable when zoomed out
// without pulling in leaflet.markercluster. `cellDeg <= 0` disables clustering.
export function clusterPoints(
  nodes: NetworkNode[],
  cellDeg: number,
): { clusters: Cluster[]; singles: NetworkNode[] } {
  if (cellDeg <= 0) return { clusters: [], singles: nodes }
  const cells = new Map<string, NetworkNode[]>()
  for (const n of nodes) {
    const key = `${Math.floor(n.lat / cellDeg)}:${Math.floor(n.lng / cellDeg)}`
    const group = cells.get(key)
    if (group) group.push(n)
    else cells.set(key, [n])
  }
  const clusters: Cluster[] = []
  const singles: NetworkNode[] = []
  for (const group of cells.values()) {
    const first = group[0]
    if (!first) continue
    if (group.length === 1) {
      singles.push(first)
      continue
    }
    const lat = group.reduce((s, g) => s + g.lat, 0) / group.length
    const lng = group.reduce((s, g) => s + g.lng, 0) / group.length
    clusters.push({
      lat,
      lng,
      ids: group.map((g) => g.id),
      count: group.length,
      hasDown: group.some((g) => g.status === 'down'),
    })
  }
  return { clusters, singles }
}

// Grid cell size (degrees) per map zoom — coarser when zoomed out, 0 above the
// ceiling so every marker shows individually once you're close enough.
export function clusterCellDeg(zoom: number): number {
  if (zoom >= 15) return 0
  if (zoom <= 11) return 0.06
  if (zoom === 12) return 0.03
  if (zoom === 13) return 0.015
  return 0.008 // zoom 14
}

import type { FaultConfidence, ProbableFault } from './faults'

// A geo-located outage hot zone: a probable-fault root placed on the map, with a
// blast radius scaled by how many customers are dark beneath it. The topology
// page renders these as translucent "impact halos" so a NOC sees WHERE the
// outage is concentrated, not just which ONUs are red.
export type FaultHotspot = {
  id: string
  lat: number
  lng: number
  downCount: number
  totalCount: number
  confidence: FaultConfidence
  /**
   * Halo radius in screen PIXELS (constant on-screen size, not geographic). A
   * geographic radius would vanish at the network-overview zoom where outages
   * are read; a pixel glyph stays a legible "intensity dot" at any zoom.
   */
  radiusPx: number
}

// Halo sizing: a floor so a single-customer fault is still visible, plus growth
// per dark customer, capped so a whole-OLT outage doesn't blanket the map.
const BASE_RADIUS_PX = 16
const PER_CUSTOMER_PX = 2.5
const MAX_RADIUS_PX = 44

// Project the already-correlated faults (see localizeFaults) onto map hot zones.
// Pure — the radius is the only derived value; everything else passes through
// from the fault root node. Faults arrive sorted (confirmed first, then by blast
// size), and that order is preserved.
export function toFaultHotspots(faults: ProbableFault[]): FaultHotspot[] {
  return faults.map((f) => ({
    id: f.node.id,
    lat: f.node.lat,
    lng: f.node.lng,
    downCount: f.downCount,
    totalCount: f.totalCount,
    confidence: f.confidence,
    radiusPx: Math.min(MAX_RADIUS_PX, BASE_RADIUS_PX + f.downCount * PER_CUSTOMER_PX),
  }))
}

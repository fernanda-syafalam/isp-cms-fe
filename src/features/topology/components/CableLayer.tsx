import { memo } from 'react'
import { Polyline, Tooltip } from 'react-leaflet'

import type { NetworkNode } from '@/schemas/topology'

import { STATUS_COLOR, fiberCore, formatLength, segmentMeters } from '../lib/graph'

const ACCENT = '#2563eb'
const CABLE_COLOR = '#64748b' // slate — feeder/distribution trunk cables

export type CableTier = 'feeder' | 'distribution' | 'drop'

const TIER_LABEL: Record<CableTier, string> = {
  feeder: 'Feeder',
  distribution: 'Distribusi',
  drop: 'Drop',
}

// Cable tier from the downstream node: OLT→ODC is feeder, ODC→ODP/pole is
// distribution, anything → customer is a drop.
function tierOf(node: NetworkNode): CableTier {
  if (node.type === 'customer') return 'drop'
  if (node.type === 'odc') return 'feeder'
  return 'distribution'
}

// Polyline style for a cable segment. Exported so the styling can be unit-tested
// without rendering Leaflet. Trunk cables are thick + slate; drops are thin and
// carry their fiber-core color (red when down); the active circuit is accented.
export function cableStyle(
  node: NetworkNode,
  active: boolean,
  dim: boolean,
  traceColor?: string | null,
): { color: string; weight: number; opacity: number } {
  const tier = tierOf(node)
  const weight = active ? 5 : tier === 'feeder' ? 4.5 : tier === 'distribution' ? 3 : 1.8
  let color = CABLE_COLOR
  // When tracing a selected customer's circuit, the active path takes the fiber
  // core colour instead of the generic accent.
  if (active) color = traceColor ?? ACCENT
  else if (tier === 'drop') {
    color =
      node.status === 'down'
        ? STATUS_COLOR.down
        : node.meta?.coreNo
          ? fiberCore(node.meta.coreNo).hex
          : STATUS_COLOR[node.status]
  }
  const opacity = dim ? 0.12 : active ? 0.95 : tier === 'drop' ? 0.85 : 0.6
  return { color, weight, opacity }
}

type Props = {
  nodes: NetworkNode[]
  byId: Map<string, NetworkNode>
  activeIds: Set<string> | null
  /** Fiber-core colour to paint the traced (active) circuit, when a customer is selected. */
  traceColor?: string | null
}

// The physical cabling view: every parent→child edge drawn as a tier-styled
// cable with a length tooltip. Replaces the logical TopologyEdges when the
// "Fisik" layer is active. Memoized so GPS/position updates don't rebuild it.
export const CableLayer = memo(function CableLayer({ nodes, byId, activeIds, traceColor }: Props) {
  return (
    <>
      {nodes.map((node) => {
        if (!node.parentId) return null
        const parent = byId.get(node.parentId)
        if (!parent) return null
        const active = activeIds ? activeIds.has(node.id) && activeIds.has(parent.id) : false
        const dim = activeIds !== null && !active
        return (
          <Polyline
            key={`cable-${node.id}`}
            positions={[
              [node.lat, node.lng],
              [parent.lat, parent.lng],
            ]}
            pathOptions={cableStyle(node, active, dim, traceColor)}
          >
            <Tooltip>
              {TIER_LABEL[tierOf(node)]} · {parent.name} → {node.name}
              <br />
              <span className="text-[11px] opacity-80">
                {formatLength(segmentMeters(node, parent))}
              </span>
            </Tooltip>
          </Polyline>
        )
      })}
    </>
  )
})

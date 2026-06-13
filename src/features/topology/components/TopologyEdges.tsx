import { memo } from 'react'
import { Polyline } from 'react-leaflet'

import type { NetworkNode } from '@/schemas/topology'

import { STATUS_COLOR, fiberCore } from '../lib/graph'

const ACCENT = '#2563eb'

// Edge color: a customer's drop cable carries its fiber-core color (TIA-598) so
// you can see which core feeds whom; a down customer still overrides to red.
// Upstream segments stay status-colored (Dude-style).
function edgeColor(node: NetworkNode): string {
  if (node.type === 'customer' && node.meta?.coreNo && node.status !== 'down') {
    return fiberCore(node.meta.coreNo).hex
  }
  return STATUS_COLOR[node.status]
}

type Props = {
  nodes: NetworkNode[]
  byId: Map<string, NetworkNode>
  activeIds: Set<string> | null
}

// The parent→child fiber segments. Each edge connects a node to its uplink; the
// active uplink path (a selected node's trace to the OLT) is accented in blue,
// everything else is dimmed. Memoized: the technician's live GPS position
// changes often but never the edges, so this skips re-rendering on every fix.
export const TopologyEdges = memo(function TopologyEdges({ nodes, byId, activeIds }: Props) {
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
            key={`${node.id}->${parent.id}`}
            positions={[
              [node.lat, node.lng],
              [parent.lat, parent.lng],
            ]}
            pathOptions={{
              color: active ? ACCENT : edgeColor(node),
              weight: active ? 3 : node.status === 'down' ? 2.5 : 1.6,
              opacity: dim
                ? 0.12
                : active
                  ? 0.9
                  : node.type === 'customer'
                    ? 0.8
                    : node.status === 'up'
                      ? 0.45
                      : 0.85,
            }}
          />
        )
      })}
    </>
  )
})

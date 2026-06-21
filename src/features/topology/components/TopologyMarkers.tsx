import { memo, useState } from 'react'
import { Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet'

import type { NetworkNode } from '@/schemas/topology'

import { clusterCellDeg, clusterPoints } from '../lib/cluster'
import { STATUS_LABEL, TYPE_LABEL } from '../lib/graph'
import { capacityColor, clusterIcon, LIFECYCLE_LABEL, nodeIcon, tooltipMeta } from './markerIcons'

type Props = {
  nodes: NetworkNode[]
  selectedId: string | null
  activeIds: Set<string> | null
  highlightIds: Set<string>
  jobNodeIds: Set<string>
  editMode: boolean
  onSelect: (id: string) => void
  onMove: (id: string, lat: number, lng: number) => void
}

// Infra node markers (OLT…customer). Selected/searched nodes get an accent
// ring; nodes outside the active uplink path are dimmed. In edit mode markers
// are draggable to reposition. Memoized (with stable onSelect/onMove from the
// page) so the technician's live GPS position updates don't rebuild every
// divIcon on each fix.
export const TopologyMarkers = memo(function TopologyMarkers({
  nodes,
  selectedId,
  activeIds,
  highlightIds,
  jobNodeIds,
  editMode,
  onSelect,
  onMove,
}: Props) {
  const map = useMap()
  const [zoom, setZoom] = useState(() => map.getZoom())
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) })

  const renderMarker = (node: NetworkNode) => {
    const dim = activeIds !== null && !activeIds.has(node.id)
    const ring = node.id === selectedId || highlightIds.has(node.id)
    const lifecycle = node.meta?.lifecycle
    const suspended =
      node.type === 'customer' && (lifecycle === 'isolir' || lifecycle === 'berhenti')
    const maintenance = node.meta?.maintenance === true
    return (
      <Marker
        key={node.id}
        position={[node.lat, node.lng]}
        icon={nodeIcon(
          node,
          ring,
          dim,
          capacityColor(node),
          jobNodeIds.has(node.id),
          suspended,
          maintenance,
        )}
        draggable={editMode}
        eventHandlers={{
          click: () => onSelect(node.id),
          dragend: (e) => {
            const ll = e.target.getLatLng()
            onMove(node.id, ll.lat, ll.lng)
          },
        }}
      >
        <Tooltip>
          <span className="font-medium">{node.name}</span>
          {' · '}
          {TYPE_LABEL[node.type]} · {STATUS_LABEL[node.status]}
          {maintenance ? <span className="text-[11px] opacity-80"> · Pemeliharaan</span> : null}
          {lifecycle && lifecycle !== 'aktif' ? (
            <span className="text-[11px] opacity-80">
              {' · '}
              {LIFECYCLE_LABEL[lifecycle] ?? lifecycle}
            </span>
          ) : null}
          {tooltipMeta(node) ? (
            <>
              <br />
              <span className="text-[11px] opacity-80">{tooltipMeta(node)}</span>
            </>
          ) : null}
        </Tooltip>
      </Marker>
    )
  }

  // Cluster only the dense customer markers when zoomed out; infra and any
  // selected / searched / job-flagged customer always render individually so
  // they're never hidden in a bubble.
  const cellDeg = clusterCellDeg(zoom)
  const forcedVisible = (n: NetworkNode) =>
    n.id === selectedId || highlightIds.has(n.id) || jobNodeIds.has(n.id)
  const individual: NetworkNode[] = []
  const clusterable: NetworkNode[] = []
  for (const n of nodes) {
    if (n.type !== 'customer' || cellDeg <= 0 || forcedVisible(n)) {
      individual.push(n)
    } else {
      clusterable.push(n)
    }
  }
  const { clusters, singles } = clusterPoints(clusterable, cellDeg)

  return (
    <>
      {individual.map(renderMarker)}
      {singles.map(renderMarker)}
      {clusters.map((c) => (
        <Marker
          key={`cluster-${c.ids[0]}-${c.count}`}
          position={[c.lat, c.lng]}
          icon={clusterIcon(c.count, c.hasDown)}
          eventHandlers={{
            click: () => map.flyTo([c.lat, c.lng], Math.min(zoom + 2, 16)),
          }}
        >
          <Tooltip>
            {c.count} pelanggan{c.hasDown ? ' · ada gangguan' : ''}
          </Tooltip>
        </Marker>
      ))}
    </>
  )
})

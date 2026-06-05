import 'leaflet/dist/leaflet.css'

import { useEffect, useRef } from 'react'
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'

import type { NetworkNode } from '@/schemas/topology'

import { STATUS_COLOR, STATUS_LABEL, TYPE_LABEL, TYPE_RADIUS } from '../lib/graph'

const ACCENT = '#2563eb'

const TILES = {
  map: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
}

type Props = {
  nodes: NetworkNode[]
  byId: Map<string, NetworkNode>
  base: 'map' | 'satellite'
  selectedId: string | null
  activeIds: Set<string> | null // null = no selection (nothing dimmed)
  highlightIds: Set<string>
  onSelect: (id: string) => void
}

function FitBounds({ nodes }: { nodes: NetworkNode[] }) {
  const map = useMap()
  const fitted = useRef(false)
  useEffect(() => {
    if (fitted.current || nodes.length === 0) return
    map.fitBounds(
      nodes.map((n) => [n.lat, n.lng] as [number, number]),
      { padding: [48, 48] },
    )
    fitted.current = true
  }, [nodes, map])
  return null
}

export function TopologyMap({
  nodes,
  byId,
  base,
  selectedId,
  activeIds,
  highlightIds,
  onSelect,
}: Props) {
  const tile = TILES[base]
  const center: [number, number] =
    nodes.length > 0 && nodes[0] ? [nodes[0].lat, nodes[0].lng] : [-6.914744, 107.60981]

  return (
    <MapContainer center={center} zoom={13} className="h-full w-full" scrollWheelZoom>
      <TileLayer key={base} url={tile.url} attribution={tile.attribution} maxZoom={19} />
      <FitBounds nodes={nodes} />

      {nodes.map((node) => {
        if (!node.parentId) return null
        const parent = byId.get(node.parentId)
        if (!parent) return null
        const active = activeIds !== null && activeIds.has(node.id) && activeIds.has(parent.id)
        const dim = activeIds !== null && !active
        return (
          <Polyline
            key={`${node.id}->${parent.id}`}
            positions={[
              [node.lat, node.lng],
              [parent.lat, parent.lng],
            ]}
            pathOptions={{
              color: active ? ACCENT : '#64748b',
              weight: active ? 3 : 1.5,
              opacity: dim ? 0.12 : active ? 0.9 : 0.5,
            }}
          />
        )
      })}

      {nodes.map((node) => {
        const dim = activeIds !== null && !activeIds.has(node.id)
        const highlighted = highlightIds.has(node.id)
        const selected = node.id === selectedId
        const ring = selected || highlighted
        return (
          <CircleMarker
            key={node.id}
            center={[node.lat, node.lng]}
            radius={TYPE_RADIUS[node.type]}
            eventHandlers={{ click: () => onSelect(node.id) }}
            pathOptions={{
              color: ring ? ACCENT : '#ffffff',
              weight: ring ? 3 : 1.5,
              fillColor: STATUS_COLOR[node.status],
              fillOpacity: dim ? 0.2 : 0.95,
              opacity: dim ? 0.3 : 1,
            }}
          >
            <Tooltip>
              <span className="font-medium">{node.name}</span>
              {' · '}
              {TYPE_LABEL[node.type]} · {STATUS_LABEL[node.status]}
            </Tooltip>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}

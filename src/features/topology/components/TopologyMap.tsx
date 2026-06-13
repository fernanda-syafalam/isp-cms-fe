import 'leaflet/dist/leaflet.css'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'

import type { NetworkNode } from '@/schemas/topology'

import type { GeoPosition } from '../hooks/useGeolocation'
import { FlyTo } from './FlyTo'
import { TopologyEdges } from './TopologyEdges'
import { TopologyMarkers } from './TopologyMarkers'
import { UserLocationLayer } from './UserLocationLayer'

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
  activeIds: Set<string> | null
  highlightIds: Set<string>
  flyToTarget: NetworkNode | null
  userPosition: GeoPosition | null
  refitKey: string
  editMode: boolean
  addMode: boolean
  onSelect: (id: string) => void
  onMove: (id: string, lat: number, lng: number) => void
  onMapClick: (lat: number, lng: number) => void
}

// Refits the map to the given nodes whenever `refitKey` changes (e.g. the user
// filters to "down" nodes) — but NOT on selection, so clicking around doesn't
// re-zoom. Fits once on first render to frame the whole network.
function FitBounds({ nodes, refitKey }: { nodes: NetworkNode[]; refitKey: string }) {
  const map = useMap()
  const lastKey = useRef<string | null>(null)
  useEffect(() => {
    if (nodes.length === 0 || lastKey.current === refitKey) return
    lastKey.current = refitKey
    map.fitBounds(
      nodes.map((n) => [n.lat, n.lng] as [number, number]),
      { padding: [48, 48] },
    )
  }, [nodes, refitKey, map])
  return null
}

function MapClick({
  enabled,
  onClick,
}: {
  enabled: boolean
  onClick: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      if (enabled) onClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export function TopologyMap({
  nodes,
  byId,
  base,
  selectedId,
  activeIds,
  highlightIds,
  flyToTarget,
  userPosition,
  refitKey,
  editMode,
  addMode,
  onSelect,
  onMove,
  onMapClick,
}: Props) {
  const tile = TILES[base]
  const center: [number, number] =
    nodes.length > 0 && nodes[0] ? [nodes[0].lat, nodes[0].lng] : [-6.5514, 110.6811]

  return (
    <MapContainer center={center} zoom={13} className="h-full w-full" scrollWheelZoom>
      <TileLayer key={base} url={tile.url} attribution={tile.attribution} maxZoom={19} />
      <FitBounds nodes={nodes} refitKey={refitKey} />
      <MapClick enabled={addMode} onClick={onMapClick} />
      <FlyTo target={flyToTarget} />
      <TopologyEdges nodes={nodes} byId={byId} activeIds={activeIds} />
      <TopologyMarkers
        nodes={nodes}
        selectedId={selectedId}
        activeIds={activeIds}
        highlightIds={highlightIds}
        editMode={editMode}
        onSelect={onSelect}
        onMove={onMove}
      />
      <UserLocationLayer position={userPosition} />
    </MapContainer>
  )
}

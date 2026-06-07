import 'leaflet/dist/leaflet.css'

import L from 'leaflet'
import { useEffect, useRef } from 'react'
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet'

import type { NetworkNode } from '@/schemas/topology'

import { STATUS_COLOR, STATUS_LABEL, TYPE_LABEL, TYPE_RADIUS, fiberCore } from '../lib/graph'

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

// One-line technical summary shown under the node name on hover.
function tooltipMeta(node: NetworkNode): string | null {
  const m = node.meta
  if (!m) return null
  const parts: string[] = []
  if (m.portsTotal) parts.push(`Port ${m.portsUsed ?? 0}/${m.portsTotal}`)
  if (typeof m.rxPowerDbm === 'number') parts.push(`${m.rxPowerDbm} dBm`)
  if (typeof m.uptimePct === 'number') parts.push(`${m.uptimePct}%`)
  if (m.coreNo) parts.push(`Core ${fiberCore(m.coreNo).name}`)
  if (m.planName) parts.push(m.planName)
  return parts.length > 0 ? parts.join(' · ') : null
}

// Edge color: a customer's drop cable carries its fiber-core color (TIA-598) so
// you can see which core feeds whom; a down customer still overrides to red.
// Upstream segments stay status-colored (Dude-style).
function edgeColor(node: NetworkNode): string {
  if (node.type === 'customer' && node.meta?.coreNo && node.status !== 'down') {
    return fiberCore(node.meta.coreNo).hex
  }
  return STATUS_COLOR[node.status]
}

// Capacity ring around a node when its ports are filling up (≥70% amber,
// ≥90% red) — surfaces near-full ODP/ODC/OLT at a glance on the map.
function capacityColor(node: NetworkNode): string | null {
  const m = node.meta
  if (!m?.portsTotal) return null
  const pct = ((m.portsUsed ?? 0) / m.portsTotal) * 100
  if (pct >= 90) return '#dc2626'
  if (pct >= 70) return '#d97706'
  return null
}

function nodeIcon(
  node: NetworkNode,
  ring: boolean,
  dim: boolean,
  capacity: string | null,
): L.DivIcon {
  const r = TYPE_RADIUS[node.type]
  const size = r * 2
  const border = ring ? `3px solid ${ACCENT}` : '2px solid #ffffff'
  const shadow = capacity
    ? `0 0 2px rgba(0,0,0,.5), 0 0 0 3px ${capacity}`
    : '0 0 2px rgba(0,0,0,.5)'
  return L.divIcon({
    className: 'topology-marker',
    iconSize: [size, size],
    iconAnchor: [r, r],
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${STATUS_COLOR[node.status]};border:${border};opacity:${dim ? 0.3 : 1};box-shadow:${shadow}"></span>`,
  })
}

type Props = {
  nodes: NetworkNode[]
  byId: Map<string, NetworkNode>
  base: 'map' | 'satellite'
  selectedId: string | null
  activeIds: Set<string> | null
  highlightIds: Set<string>
  editMode: boolean
  addMode: boolean
  onSelect: (id: string) => void
  onMove: (id: string, lat: number, lng: number) => void
  onMapClick: (lat: number, lng: number) => void
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
      <FitBounds nodes={nodes} />
      <MapClick enabled={addMode} onClick={onMapClick} />

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
              // Customer drops show their fiber-core color; upstream segments
              // show node health; a down drop overrides to red (see edgeColor).
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

      {nodes.map((node) => {
        const dim = activeIds !== null && !activeIds.has(node.id)
        const ring = node.id === selectedId || highlightIds.has(node.id)
        return (
          <Marker
            key={node.id}
            position={[node.lat, node.lng]}
            icon={nodeIcon(node, ring, dim, capacityColor(node))}
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
              {tooltipMeta(node) ? (
                <>
                  <br />
                  <span className="text-[11px] opacity-80">{tooltipMeta(node)}</span>
                </>
              ) : null}
            </Tooltip>
          </Marker>
        )
      })}
    </MapContainer>
  )
}

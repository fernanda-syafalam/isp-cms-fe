import L from 'leaflet'
import { Marker, Tooltip } from 'react-leaflet'

import type { NetworkNode } from '@/schemas/topology'

import { STATUS_COLOR, STATUS_LABEL, TYPE_LABEL, TYPE_RADIUS, fiberCore } from '../lib/graph'

const ACCENT = '#2563eb'

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
  selectedId: string | null
  activeIds: Set<string> | null
  highlightIds: Set<string>
  editMode: boolean
  onSelect: (id: string) => void
  onMove: (id: string, lat: number, lng: number) => void
}

// Infra node markers (OLT…customer). Selected/searched nodes get an accent
// ring; nodes outside the active uplink path are dimmed. In edit mode markers
// are draggable to reposition.
export function TopologyMarkers({
  nodes,
  selectedId,
  activeIds,
  highlightIds,
  editMode,
  onSelect,
  onMove,
}: Props) {
  return (
    <>
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
    </>
  )
}

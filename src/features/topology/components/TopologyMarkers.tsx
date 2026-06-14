import L from 'leaflet'
import { memo, useState } from 'react'
import { Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet'

import type { NetworkNode } from '@/schemas/topology'

import { clusterCellDeg, clusterPoints } from '../lib/cluster'
import {
  MAINTENANCE_COLOR,
  STATUS_COLOR,
  STATUS_LABEL,
  SUSPEND_COLOR,
  TYPE_LABEL,
  TYPE_RADIUS,
  fiberCore,
} from '../lib/graph'

const LIFECYCLE_LABEL: Record<string, string> = {
  prospek: 'Prospek',
  instalasi: 'Instalasi',
  aktif: 'Aktif',
  isolir: 'Isolir (ditangguhkan)',
  berhenti: 'Berhenti',
}

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
  job: boolean,
  suspended: boolean,
  maintenance: boolean,
): L.DivIcon {
  const r = TYPE_RADIUS[node.type]
  const size = r * 2
  const border = ring ? `3px solid ${ACCENT}` : '2px solid #ffffff'
  const shadow = capacity
    ? `0 0 2px rgba(0,0,0,.5), 0 0 0 3px ${capacity}`
    : '0 0 2px rgba(0,0,0,.5)'
  // Planned maintenance (sky) wins over billing-suspended (slate) and over the
  // network status color, so a node under scheduled work never reads as a fiber
  // fault (red). Network status still drives every other node's color.
  const fill = maintenance
    ? MAINTENANCE_COLOR
    : suspended
      ? SUSPEND_COLOR
      : STATUS_COLOR[node.status]
  // An amber badge marks a customer with an open work order / ticket — stays
  // fully opaque even when the node is dimmed so jobs stand out at a glance.
  const badge = job
    ? '<span style="position:absolute;top:-3px;right:-3px;width:8px;height:8px;border-radius:9999px;background:#f59e0b;border:1.5px solid #fff"></span>'
    : ''
  return L.divIcon({
    className: 'topology-marker',
    iconSize: [size, size],
    iconAnchor: [r, r],
    html: `<span style="position:relative;display:block;width:${size}px;height:${size}px"><span style="display:block;width:100%;height:100%;border-radius:9999px;background:${fill};border:${border};opacity:${dim ? 0.3 : 1};box-shadow:${shadow}"></span>${badge}</span>`,
  })
}

// Cluster bubble for a group of nearby customers (zoomed out). Red when any
// member is down, so an outage stays visible even when collapsed.
function clusterIcon(count: number, hasDown: boolean): L.DivIcon {
  const size = count >= 50 ? 40 : count >= 10 ? 34 : 28
  const bg = hasDown ? '#dc2626' : '#2563eb'
  return L.divIcon({
    className: 'topology-cluster',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<span style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:${bg}e0;border:2px solid #fff;color:#fff;font-size:12px;font-weight:600;box-shadow:0 0 3px rgba(0,0,0,.5)">${count}</span>`,
  })
}

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

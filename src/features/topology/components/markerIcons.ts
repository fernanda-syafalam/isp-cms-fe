import L from 'leaflet'

import type { NetworkNode } from '@/schemas/topology'

import {
  fiberCore,
  MAINTENANCE_COLOR,
  STATUS_COLOR,
  SUSPEND_COLOR,
  TYPE_RADIUS,
} from '../lib/graph'

export const LIFECYCLE_LABEL: Record<string, string> = {
  prospek: 'Prospek',
  instalasi: 'Instalasi',
  aktif: 'Aktif',
  isolir: 'Isolir (ditangguhkan)',
  berhenti: 'Berhenti',
}

const ACCENT = '#2563eb'

// Colorblind safety: a marker must not encode status by color alone. Each of the
// five visual states gets its own SHAPE (silhouette) on top of its color, so a
// colorblind NOC operator can tell an outage from unknown from maintenance
// without relying on hue. This mirrors the tree's StatusGlyph vocabulary
// (`TopologyTree.tsx`): up = filled circle, down = diamond, unknown = hollow
// (ring) — and extends it to the two map-only overrides (suspended, maintenance)
// that the tree does not render.
type MarkerShape = {
  // border-radius of the colored body: '9999px' = round family, small px = square
  // family. A hollow (ring) variant carries the same radius on its inner cutout.
  radius: string
  // rotation (deg) of the colored body — 45° turns a square into a diamond.
  rotate: number
  // hollow = a ring/donut (colored body with a white center) instead of a solid.
  hollow: boolean
}

const STATUS_SHAPE: Record<'up' | 'down' | 'unknown' | 'suspended' | 'maintenance', MarkerShape> = {
  up: { radius: '9999px', rotate: 0, hollow: false }, // filled circle (mirrors tree)
  down: { radius: '3px', rotate: 45, hollow: false }, // diamond (mirrors tree)
  unknown: { radius: '9999px', rotate: 0, hollow: true }, // hollow circle / ring (mirrors tree)
  suspended: { radius: '2px', rotate: 0, hollow: false }, // solid square
  maintenance: { radius: '2px', rotate: 0, hollow: true }, // hollow square
}

// Escape a data string before it is interpolated into the divIcon HTML attribute
// (Leaflet assigns this via innerHTML). The node name is user/customer data, so
// it must be escaped to avoid breaking the markup or injecting HTML.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// One-line technical summary shown under the node name on hover.
export function tooltipMeta(node: NetworkNode): string | null {
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
export function capacityColor(node: NetworkNode): string | null {
  const m = node.meta
  if (!m?.portsTotal) return null
  const pct = ((m.portsUsed ?? 0) / m.portsTotal) * 100
  if (pct >= 90) return '#dc2626'
  if (pct >= 70) return '#d97706'
  return null
}

export function nodeIcon(
  node: NetworkNode,
  ring: boolean,
  dim: boolean,
  capacity: string | null,
  job: boolean,
  suspended: boolean,
  maintenance: boolean,
  // Accessible name for the marker, e.g. "Budi · Down · Pemeliharaan". Rendered
  // as the divIcon's aria-label so the status is available to assistive tech as
  // text — not only via the hover tooltip. Built by the caller from the existing
  // Bahasa-Indonesia status labels.
  accessibleName: string,
): L.DivIcon {
  const r = TYPE_RADIUS[node.type]
  const size = r * 2
  const border = ring ? `3px solid ${ACCENT}` : '2px solid #ffffff'
  const shadow = capacity
    ? `0 0 2px rgba(0,0,0,.5), 0 0 0 3px ${capacity}`
    : '0 0 2px rgba(0,0,0,.5)'
  // Planned maintenance (sky) wins over billing-suspended (slate) and over the
  // network status color, so a node under scheduled work never reads as a fiber
  // fault (red). Network status still drives every other node's color. The same
  // precedence chooses the marker SHAPE, so shape and color always agree.
  const visual = maintenance ? 'maintenance' : suspended ? 'suspended' : node.status
  const fill = maintenance
    ? MAINTENANCE_COLOR
    : suspended
      ? SUSPEND_COLOR
      : STATUS_COLOR[node.status]
  const shape = STATUS_SHAPE[visual]
  // Hollow (ring) statuses get a white center cut out of the colored body, using
  // the same radius family so a hollow circle stays round and a hollow square
  // stays square.
  const innerRadius = shape.radius === '9999px' ? '9999px' : '1px'
  const hole = shape.hollow
    ? `<span style="width:50%;height:50%;border-radius:${innerRadius};background:#ffffff"></span>`
    : ''
  const body = `<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;border-radius:${shape.radius};background:${fill};border:${border};opacity:${dim ? 0.3 : 1};box-shadow:${shadow};transform:rotate(${shape.rotate}deg)">${hole}</span>`
  // An amber badge marks a customer with an open work order / ticket — stays
  // fully opaque even when the node is dimmed so jobs stand out at a glance.
  const badge = job
    ? '<span style="position:absolute;top:-3px;right:-3px;width:8px;height:8px;border-radius:9999px;background:#f59e0b;border:1.5px solid #fff"></span>'
    : ''
  const label = escapeHtml(accessibleName)
  return L.divIcon({
    className: 'topology-marker',
    iconSize: [size, size],
    iconAnchor: [r, r],
    html: `<span role="img" aria-label="${label}" style="position:relative;display:block;width:${size}px;height:${size}px">${body}${badge}</span>`,
  })
}

// Cluster bubble for a group of nearby customers (zoomed out). Red when any
// member is down, so an outage stays visible even when collapsed.
export function clusterIcon(count: number, hasDown: boolean): L.DivIcon {
  const size = count >= 50 ? 40 : count >= 10 ? 34 : 28
  const bg = hasDown ? '#dc2626' : '#2563eb'
  return L.divIcon({
    className: 'topology-cluster',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<span style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:${bg}e0;border:2px solid #fff;color:#fff;font-size:12px;font-weight:600;box-shadow:0 0 3px rgba(0,0,0,.5)">${count}</span>`,
  })
}

import L from 'leaflet'
import { useEffect, useRef } from 'react'
import { Circle, Marker, Tooltip, useMap } from 'react-leaflet'

import type { GeoPosition } from '../hooks/useGeolocation'

// A pulsing blue dot, deliberately different from the infra node markers (no
// white ring, animated glow) so the technician can't confuse "me" with a node.
// The .topology-pulse animation lives in globals.css (no inline keyframes).
const USER_ICON = L.divIcon({
  className: 'topology-user-icon',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  html: '<span class="topology-pulse" role="img" aria-label="Lokasi Anda saat ini"></span>',
})

// Renders the technician's location (marker + GPS accuracy circle) and flies to
// it the first time a fix arrives — once, so it doesn't yank the map away while
// they pan. Re-enabling location (position goes null → set) re-centers.
export function UserLocationLayer({ position }: { position: GeoPosition | null }) {
  const map = useMap()
  const flown = useRef(false)

  useEffect(() => {
    if (!position) {
      flown.current = false
      return
    }
    if (flown.current) return
    flown.current = true
    map.flyTo([position.lat, position.lng], Math.max(map.getZoom(), 16))
  }, [position, map])

  if (!position) return null
  return (
    <>
      <Circle
        center={[position.lat, position.lng]}
        radius={position.accuracy}
        pathOptions={{
          color: '#2563eb',
          fillColor: '#2563eb',
          fillOpacity: 0.08,
          weight: 1,
        }}
      />
      <Marker position={[position.lat, position.lng]} icon={USER_ICON} zIndexOffset={1000}>
        <Tooltip>Lokasi Anda</Tooltip>
      </Marker>
    </>
  )
}

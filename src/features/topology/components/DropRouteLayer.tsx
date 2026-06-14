import L from 'leaflet'
import { Marker, Polyline } from 'react-leaflet'

import type { NetworkNode } from '@/schemas/topology'

import { useCables, useUpdateCableRoute } from '../hooks/useCabling'
import { fiberCore } from '../lib/graph'

// Small white handle for dragging a surveyed-route waypoint.
const waypointIcon = L.divIcon({
  className: 'route-waypoint',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  html: '<span style="display:block;width:12px;height:12px;border-radius:9999px;background:#fff;border:2px solid #2563eb;box-shadow:0 0 2px rgba(0,0,0,.5)"></span>',
})

type Props = {
  selected: NetworkNode | null
  editMode: boolean
}

// Overlays the selected customer's drop cable along its surveyed route (the
// stored waypoints, not a straight line), in the fiber-core colour. In edit mode
// the interior waypoints become draggable handles that PATCH the route on drop.
// Self-contained: reads the drop cable from the cabling cache and mutates it.
export function DropRouteLayer({ selected, editMode }: Props) {
  const cables = useCables().data?.items
  const update = useUpdateCableRoute()
  if (selected?.type !== 'customer') return null
  const cable = cables?.find((c) => c.toNodeId === selected.id)
  if (!cable || cable.route.length < 2) return null

  const color = selected.meta?.coreNo ? fiberCore(selected.meta.coreNo).hex : '#2563eb'
  const route = cable.route

  return (
    <>
      <Polyline
        positions={route.map((p) => [p.lat, p.lng] as [number, number])}
        pathOptions={{ color, weight: 3, dashArray: '6 6', opacity: 0.9 }}
      />
      {editMode
        ? route.slice(1, -1).map((p, i) => {
            const routeIndex = i + 1
            return (
              <Marker
                key={`wp-${routeIndex}`}
                position={[p.lat, p.lng]}
                icon={waypointIcon}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const ll = e.target.getLatLng()
                    const next = route.map((q, idx) =>
                      idx === routeIndex ? { lat: ll.lat, lng: ll.lng } : q,
                    )
                    update.mutate({ id: cable.id, input: { route: next } })
                  },
                }}
              />
            )
          })
        : null}
    </>
  )
}

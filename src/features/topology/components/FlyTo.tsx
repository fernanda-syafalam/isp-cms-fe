import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'

import type { NetworkNode } from '@/schemas/topology'

// Flies the map to a node when `target` changes — used by search and "nearest
// ODP". A `lastId` ref guards against re-flying on unrelated re-renders or when
// the same node is picked twice; only a genuinely new target moves the map, so
// it never fights the user's manual pan/zoom. Null target = no-op.
export function FlyTo({ target }: { target: NetworkNode | null }) {
  const map = useMap()
  const lastId = useRef<string | null>(null)

  useEffect(() => {
    if (!target || target.id === lastId.current) return
    lastId.current = target.id
    map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 16))
  }, [target, map])

  return null
}

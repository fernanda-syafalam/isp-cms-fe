import { SplineIcon, WaypointsIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { LatLng } from '@/schemas/cable'
import type { NetworkNode } from '@/schemas/topology'

import { useCables, useUpdateCableRoute } from '../hooks/useCabling'
import { formatLength, segmentMeters } from '../lib/graph'

type Props = {
  node: NetworkNode
}

// Insert a waypoint at the midpoint of the longest segment — the tech then drags
// the new handle to where the cable actually bends.
function withBend(route: LatLng[]): LatLng[] {
  let at = 0
  let longest = -1
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i]
    const b = route[i + 1]
    if (!a || !b) continue
    const d = segmentMeters(a, b)
    if (d > longest) {
      longest = d
      at = i
    }
  }
  const a = route[at]
  const b = route[at + 1]
  if (!a || !b) return route
  const mid = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 }
  return [...route.slice(0, at + 1), mid, ...route.slice(at + 1)]
}

// Route editor for the selected customer's drop cable (edit mode): add a bend or
// straighten the run. Dragging the bends happens on the map (DropRouteLayer).
// Self-contained: reads the drop cable + mutates the route.
export function DropRouteControls({ node }: Props) {
  const cables = useCables().data?.items
  const update = useUpdateCableRoute()
  if (node.type !== 'customer') return null
  const cable = cables?.find((c) => c.toNodeId === node.id)
  if (!cable) return null

  const hasBends = cable.route.length > 2
  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Rute drop</span>
        <span className="font-mono text-muted-foreground text-xs tabular-nums">
          {formatLength(cable.lengthM)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 flex-1"
          disabled={update.isPending}
          onClick={() =>
            update.mutate({
              id: cable.id,
              input: { route: withBend(cable.route) },
            })
          }
        >
          <WaypointsIcon className="size-4" />
          Tambah belokan
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 flex-1"
          disabled={update.isPending || !hasBends}
          onClick={() => {
            const first = cable.route[0]
            const last = cable.route.at(-1)
            if (first && last) {
              update.mutate({ id: cable.id, input: { route: [first, last] } })
            }
          }}
        >
          <SplineIcon className="size-4" />
          Luruskan
        </Button>
      </div>
    </div>
  )
}

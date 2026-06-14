import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { OdpCapacity } from '../lib/graph'

type Props = {
  items: OdpCapacity[]
  onSelect: (id: string) => void
}

// "Kapasitas ODP": ODPs running low on free ports, fullest first — a planning
// aid so ops adds capacity before an install is rejected. Each row focuses the
// ODP on the map. Renders nothing when no ODP is near full.
export function CapacityPanel({ items, onSelect }: Props) {
  if (items.length === 0) return null
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Kapasitas ODP</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {items.map((c) => {
          const free = c.total - c.used
          const barClass = c.pct >= 90 ? 'bg-red-500' : c.pct >= 70 ? 'bg-amber-500' : 'bg-primary'
          return (
            <button
              key={c.node.id}
              type="button"
              onClick={() => onSelect(c.node.id)}
              className="w-full cursor-pointer rounded-md border px-2.5 py-2 text-left transition-colors hover:bg-muted"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate font-medium text-sm">{c.node.name}</span>
                <span className="shrink-0 font-mono text-muted-foreground text-xs tabular-nums">
                  {c.used}/{c.total} · sisa {free}
                </span>
              </span>
              <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <span
                  className={`block h-full rounded-full ${barClass}`}
                  style={{ width: `${Math.max(2, c.pct)}%` }}
                />
              </span>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}

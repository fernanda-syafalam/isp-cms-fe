import { MapPinnedIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { NetworkNode } from '@/schemas/topology'

import { formatLength } from '../lib/graph'

type Props = {
  /** Nearest ODP with a free port from the technician's location, if located. */
  nearestOdp: { node: NetworkNode; meters: number } | null
  onPickNearest: (node: NetworkNode) => void
}

// The map key, shown when no node is selected. When the technician's location
// is known it leads with a "nearest free ODP" shortcut (the install question:
// "where can I hook up from here?").
export function TopologyLegend({ nearestOdp, onPickNearest }: Props) {
  return (
    <Card>
      <CardContent className="pt-6 text-muted-foreground text-sm">
        {nearestOdp ? (
          <Button
            variant="outline"
            className="mb-4 h-auto w-full justify-start gap-2 py-2 text-left"
            onClick={() => onPickNearest(nearestOdp.node)}
          >
            <MapPinnedIcon className="size-4 shrink-0 text-primary" />
            <span className="flex flex-col">
              <span className="font-medium text-foreground">ODP kosong terdekat</span>
              <span className="text-muted-foreground text-xs">
                {nearestOdp.node.name} · {formatLength(nearestOdp.meters)}
              </span>
            </span>
          </Button>
        ) : null}
        <p className="font-medium text-foreground">Legenda peta</p>
        <ul className="mt-2 space-y-2">
          <li className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full bg-green-600" />
            <span className="size-2.5 shrink-0 rotate-45 rounded-[2px] bg-red-600" />
            <span className="size-2.5 shrink-0 rounded-full border-2 border-amber-600" />
            Status node: Up / Down / Unknown
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1 w-6 shrink-0 rounded-full bg-green-600/60" />
            <span className="h-1 w-6 shrink-0 rounded-full bg-red-600" />
            Kabel feeder (OLT→ODP) = warna status node.
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1 w-3 shrink-0 rounded-full bg-blue-600" />
            <span className="h-1 w-3 shrink-0 rounded-full bg-orange-500" />
            <span className="h-1 w-3 shrink-0 rounded-full bg-green-600" />
            Drop pelanggan = warna core fiber (TIA-598); merah bila down.
          </li>
          <li className="flex items-center gap-2">
            <span className="size-3 shrink-0 rounded-full bg-muted-foreground/30 ring-2 ring-amber-500" />
            <span className="size-3 shrink-0 rounded-full bg-muted-foreground/30 ring-2 ring-red-600" />
            Cincin = kapasitas port (≥70% amber, ≥90% merah).
          </li>
          <li>Ukuran titik = tipe (OLT terbesar → Pelanggan terkecil).</li>
          <li>Klik titik: sorot jalur uplink, detail teknis, & blast-radius.</li>
        </ul>
      </CardContent>
    </Card>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ClosureType } from '@/schemas/closure'

import { useClosures, useSplices } from '../hooks/useCabling'
import { fiberCore } from '../lib/graph'

const CLOSURE_TYPE_LABEL: Record<ClosureType, string> = {
  odc: 'ODC',
  odp: 'ODP',
  joint: 'Sambungan',
  inline: 'Inline',
}

type Props = {
  nodeId: string
}

// Closure detail for a selected ODC/ODP: tray + fiber capacity and the fusion
// splices inside it (the feeder→drop joints). Renders nothing if the node has no
// closure. Self-fetches from the shared cabling cache.
export function ClosureDetail({ nodeId }: Props) {
  const closures = useClosures().data?.items
  const allSplices = useSplices().data?.items ?? []
  const closure = closures?.find((c) => c.nodeId === nodeId)
  if (!closure) return null
  const splices = allSplices.filter((s) => s.closureId === closure.id)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">
          Closure {CLOSURE_TYPE_LABEL[closure.type]}{' '}
          <span className="font-normal text-muted-foreground">
            ({splices.length}/{closure.fiberCapacity} sambungan)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
          <dt className="text-muted-foreground">Kapasitas tray</dt>
          <dd className="text-right font-mono tabular-nums">{closure.trayCapacity}</dd>
          <dt className="text-muted-foreground">Kapasitas fiber</dt>
          <dd className="text-right font-mono tabular-nums">{closure.fiberCapacity}</dd>
        </dl>
        {splices.length > 0 ? (
          <ol className="space-y-1 border-border border-t pt-2">
            {splices.map((s) => {
              const core = fiberCore(s.outCoreNo)
              return (
                <li key={s.id} className="flex items-center gap-2">
                  <span className="text-muted-foreground">Feeder →</span>
                  <span
                    className="size-2.5 shrink-0 rounded-full border border-border"
                    style={{ background: core.hex }}
                  />
                  <span>
                    Core #{s.outCoreNo} {core.name}
                  </span>
                  <span className="ml-auto font-mono text-muted-foreground tabular-nums">
                    {s.type} · {s.lossDb} dB
                  </span>
                </li>
              )
            })}
          </ol>
        ) : (
          <p className="text-muted-foreground">Belum ada sambungan.</p>
        )}
      </CardContent>
    </Card>
  )
}

import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CircuitStatus } from '@/schemas/circuit'
import type { NetworkNode } from '@/schemas/topology'

import { useCables, useCircuits, useStrands } from '../hooks/useCabling'
import { fiberCore } from '../lib/graph'

const STATUS_TONE: Record<CircuitStatus, StatusTone> = {
  active: 'success',
  planned: 'info',
  down: 'danger',
}
const STATUS_LABEL: Record<CircuitStatus, string> = {
  active: 'Aktif',
  planned: 'Rencana',
  down: 'Padam',
}

type Props = {
  node: NetworkNode
}

// The selected subscriber's optical circuit: OLT PON port + ONU serial + status,
// and the drop strand (cable/tube/core) that carries it. Reads the circuit and
// strand caches; renders nothing if the node has no circuit (e.g. infra nodes).
export function CircuitPanel({ node }: Props) {
  const circuit = useCircuits().data?.items.find(
    (c) =>
      c.customerNodeId === node.id ||
      (node.meta?.customerId != null && c.customerId === node.meta.customerId),
  )
  const strands = useStrands().data?.items ?? []
  const cables = useCables().data?.items ?? []
  if (!circuit) return null

  const strand = strands.find((s) => s.circuitId === circuit.id)
  const cable = strand ? cables.find((c) => c.id === strand.cableId) : undefined
  const core = strand ? fiberCore(strand.coreNo) : null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Sirkuit optik</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
          <dt className="text-muted-foreground">Status</dt>
          <dd className="text-right">
            <StatusBadge tone={STATUS_TONE[circuit.status]} label={STATUS_LABEL[circuit.status]} />
          </dd>
          <dt className="text-muted-foreground">Port PON (OLT)</dt>
          <dd className="text-right font-mono tabular-nums">{circuit.oltPonPort}</dd>
          <dt className="text-muted-foreground">Serial ONU</dt>
          <dd className="text-right font-mono">{circuit.onuSerial ?? '—'}</dd>
        </dl>
        {strand && core ? (
          <div className="flex items-center gap-2 border-border border-t pt-2">
            <span className="text-muted-foreground">Strand drop</span>
            <span
              className="size-2.5 shrink-0 rounded-full border border-border"
              style={{ background: core.hex }}
            />
            <span>
              Core #{strand.coreNo} {core.name} · tube {strand.tubeNo}
            </span>
            {cable ? (
              <span className="ml-auto truncate font-mono text-muted-foreground">{cable.spec}</span>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

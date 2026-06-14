import { Link } from '@tanstack/react-router'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Splitter } from '@/schemas/splitter'
import type { NetworkNode } from '@/schemas/topology'

import { fiberId } from '../lib/graph'

type Props = {
  splitter: Splitter
  byId: Map<string, NetworkNode>
}

// Per-port view of an ODC/ODP splitter: which downstream node/customer occupies
// each output port (and its TIA-598 core color), so a technician can see exactly
// which port to patch. Shown beside the node detail when an ODC/ODP is selected.
export function SplitterPorts({ splitter, byId }: Props) {
  const used = splitter.ports.filter((p) => p.outNodeId !== null).length
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">
          Port splitter {splitter.ratio}{' '}
          <span className="font-normal text-muted-foreground">
            ({used}/{splitter.ports.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-1">
          {splitter.ports.map((port) => {
            const down = port.outNodeId ? byId.get(port.outNodeId) : undefined
            const core = fiberId(port.portNo).core
            return (
              <li key={port.portNo} className="flex items-center gap-2 text-xs">
                <span className="w-5 shrink-0 text-right font-mono text-muted-foreground tabular-nums">
                  {port.portNo}
                </span>
                <span
                  className="size-2.5 shrink-0 rounded-full border border-border"
                  style={{ background: core.hex }}
                />
                {down ? (
                  port.customerId ? (
                    <Link
                      to="/customers/$customerId"
                      params={{ customerId: port.customerId }}
                      className="truncate hover:underline"
                    >
                      {down.name}
                    </Link>
                  ) : (
                    <span className="truncate">{down.name}</span>
                  )
                ) : (
                  <span className="text-muted-foreground">kosong</span>
                )}
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}

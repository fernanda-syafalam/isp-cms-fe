import { PencilIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/format'
import type { Cable, CableKind } from '@/schemas/cable'
import type { NetworkNode } from '@/schemas/topology'

import { useCables } from '../hooks/useCabling'
import { CableEditDialog } from './CableEditDialog'

const KIND_LABEL: Record<CableKind, string> = {
  feeder: 'Feeder',
  distribution: 'Distribusi',
  drop: 'Drop',
}

type Props = {
  node: NetworkNode
  byId: Map<string, NetworkNode>
  /** Gates the edit control (network.manage). */
  canManage: boolean
}

// Physical cables touching the selected node, each editable in place (metadata).
// Renders nothing when the node has no cables, so it never clutters the aside.
export function NodeCablesPanel({ node, byId, canManage }: Props) {
  const cables = (useCables().data?.items ?? []).filter(
    (c) => c.fromNodeId === node.id || c.toNodeId === node.id,
  )
  const [editing, setEditing] = useState<Cable | null>(null)
  if (cables.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Kabel ({cables.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-xs">
        {cables.map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            <span className="font-medium">{KIND_LABEL[c.kind]}</span>
            <span className="truncate text-muted-foreground">{c.spec}</span>
            <span className="ml-auto shrink-0 font-mono text-muted-foreground tabular-nums">
              {formatNumber(c.lengthM)} m
            </span>
            {canManage ? (
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground hover:text-foreground"
                aria-label="Edit kabel"
                onClick={() => setEditing(c)}
              >
                <PencilIcon className="size-3.5" />
              </Button>
            ) : null}
          </div>
        ))}
      </CardContent>

      {editing ? (
        <CableEditDialog
          cable={editing}
          byId={byId}
          open
          onOpenChange={(o) => {
            if (!o) setEditing(null)
          }}
        />
      ) : null}
    </Card>
  )
}

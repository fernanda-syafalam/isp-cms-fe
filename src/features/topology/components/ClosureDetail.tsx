import { PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ClosureType } from '@/schemas/closure'

import { useClosures, useDeleteSplice, useSplices } from '../hooks/useCabling'
import { fiberCore } from '../lib/graph'
import { ClosureFormDialog } from './ClosureFormDialog'
import { SpliceFormDialog } from './SpliceFormDialog'

const CLOSURE_TYPE_LABEL: Record<ClosureType, string> = {
  odc: 'ODC',
  odp: 'ODP',
  joint: 'Sambungan',
  inline: 'Inline',
}

type Props = {
  nodeId: string
  /** Host node type — seeds the closure type when adding one. */
  nodeType: 'odc' | 'odp'
  /** Gates the add/delete controls (network.manage). */
  canManage: boolean
}

// Closure detail for a selected ODC/ODP: tray + fiber capacity and the fusion
// splices inside it (the feeder→drop joints). Self-fetches from the shared
// cabling cache. With manage rights, the closure can be added when missing and
// its splices added/removed in place.
export function ClosureDetail({ nodeId, nodeType, canManage }: Props) {
  const closures = useClosures().data?.items
  const allSplices = useSplices().data?.items ?? []
  const deleteSplice = useDeleteSplice()
  const [addOpen, setAddOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const closure = closures?.find((c) => c.nodeId === nodeId)

  // No closure yet: offer to add one (manage only); otherwise show nothing.
  if (!closure) {
    if (!canManage) return null
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Closure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <p className="text-muted-foreground">Node ini belum punya closure.</p>
          <Button variant="outline" size="sm" className="h-7" onClick={() => setCreateOpen(true)}>
            <PlusIcon className="size-3.5" />
            Tambah closure
          </Button>
        </CardContent>
        <ClosureFormDialog
          nodeId={nodeId}
          defaultType={nodeType}
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      </Card>
    )
  }

  const splices = allSplices.filter((s) => s.closureId === closure.id)
  const full = splices.length >= closure.fiberCapacity

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm">
          Closure {CLOSURE_TYPE_LABEL[closure.type]}{' '}
          <span className="font-normal text-muted-foreground">
            ({splices.length}/{closure.fiberCapacity} sambungan)
          </span>
        </CardTitle>
        {canManage ? (
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            disabled={full}
            onClick={() => setAddOpen(true)}
          >
            <PlusIcon className="size-3.5" />
            Tambah
          </Button>
        ) : null}
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
                  {canManage ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground hover:text-destructive"
                      aria-label="Hapus sambungan"
                      disabled={deleteSplice.isPending}
                      onClick={() => deleteSplice.mutate(s.id)}
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  ) : null}
                </li>
              )
            })}
          </ol>
        ) : (
          <p className="text-muted-foreground">Belum ada sambungan.</p>
        )}
      </CardContent>

      {canManage ? (
        <SpliceFormDialog
          closureId={closure.id}
          nodeId={nodeId}
          open={addOpen}
          onOpenChange={setAddOpen}
        />
      ) : null}
    </Card>
  )
}

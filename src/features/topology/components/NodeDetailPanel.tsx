import { PencilIcon, Trash2Icon, XIcon } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { NetworkNode, NodeStatus } from '@/schemas/topology'

import { STATUS_LABEL, TYPE_LABEL, downstreamIds, uplinkPath } from '../lib/graph'

const STATUS_TONE: Record<NodeStatus, StatusTone> = {
  up: 'success',
  down: 'danger',
  unknown: 'warning',
}

type Props = {
  node: NetworkNode
  byId: Map<string, NetworkNode>
  nodes: NetworkNode[]
  editMode: boolean
  onClear: () => void
  onEdit: () => void
  onDelete: () => void
}

export function NodeDetailPanel({ node, byId, nodes, editMode, onClear, onEdit, onDelete }: Props) {
  const path = uplinkPath(node, byId)
  const downstream = downstreamIds(node.id, nodes)
  const customerCount = nodes.filter((n) => n.type === 'customer' && downstream.has(n.id)).length

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="min-w-0">
          <CardTitle className="truncate text-base">{node.name}</CardTitle>
          <p className="mt-1 text-muted-foreground text-xs">{TYPE_LABEL[node.type]}</p>
        </div>
        <div className="flex items-center gap-1">
          <StatusBadge tone={STATUS_TONE[node.status]} label={STATUS_LABEL[node.status]} />
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Tutup"
            onClick={onClear}
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="mb-1 text-muted-foreground text-xs">Jalur uplink</p>
          <ol className="flex flex-wrap items-center gap-x-1 gap-y-1">
            {path.map((p, i) => (
              <li key={p.id} className="flex items-center gap-1">
                {i > 0 ? <span className="text-muted-foreground">→</span> : null}
                <span className={p.id === node.id ? 'font-medium' : 'text-muted-foreground'}>
                  {p.name}
                </span>
              </li>
            ))}
          </ol>
        </div>
        {node.type !== 'customer' ? (
          <div className="flex items-center justify-between border-border border-t pt-3">
            <span className="text-muted-foreground text-xs">Pelanggan downstream</span>
            <span className="font-mono font-semibold tabular-nums">{customerCount}</span>
          </div>
        ) : null}
        {editMode ? (
          <div className="flex items-center gap-2 border-border border-t pt-3">
            <Button variant="outline" size="sm" className="h-8 flex-1" onClick={onEdit}>
              <PencilIcon className="size-4" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-destructive">
                  <Trash2Icon className="size-4" />
                  Hapus
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus node?</AlertDialogTitle>
                  <AlertDialogDescription>
                    "{node.name}" akan dihapus; node turunannya disambungkan ke induk di atasnya.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={onDelete}
                  >
                    Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

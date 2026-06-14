import { NavigationIcon, PencilIcon, Trash2Icon, TriangleAlertIcon, XIcon } from 'lucide-react'

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
import type { NetworkNode, NodeLifecycle, NodeStatus } from '@/schemas/topology'

import {
  STATUS_LABEL,
  TYPE_LABEL,
  downstreamIds,
  linkBudget,
  segmentMeters,
  uplinkPath,
} from '../lib/graph'
import { NodeMetaDetails } from './NodeMetaDetails'
import { PowerBudget } from './NodePowerBudget'

const STATUS_TONE: Record<NodeStatus, StatusTone> = {
  up: 'success',
  down: 'danger',
  unknown: 'warning',
}

// Billing/service lifecycle, shown alongside (not instead of) the network
// status: a tech must see "fiber up but isolir for non-payment" as two facts.
const LIFECYCLE_LABEL: Record<NodeLifecycle, string> = {
  prospek: 'Prospek',
  instalasi: 'Instalasi',
  aktif: 'Aktif',
  isolir: 'Isolir',
  berhenti: 'Berhenti',
}

const LIFECYCLE_TONE: Record<NodeLifecycle, StatusTone> = {
  prospek: 'neutral',
  instalasi: 'info',
  aktif: 'success',
  isolir: 'warning',
  berhenti: 'neutral',
}

type Props = {
  node: NetworkNode
  byId: Map<string, NetworkNode>
  nodes: NetworkNode[]
  editMode: boolean
  /** Straight-line distance from the technician's location, when known. */
  distanceMeters?: number | undefined
  /** Hide the panel's own close button (e.g. inside a Sheet that has its own). */
  showClose?: boolean
  onClear: () => void
  onEdit: () => void
  onDelete: () => void
}

export function NodeDetailPanel({
  node,
  byId,
  nodes,
  editMode,
  distanceMeters,
  showClose = true,
  onClear,
  onEdit,
  onDelete,
}: Props) {
  const path = uplinkPath(node, byId)
  const parent = node.parentId ? byId.get(node.parentId) : undefined
  const cableMeters = parent ? segmentMeters(node, parent) : undefined
  // Optical power budget is meaningful below the OLT (after the first splitter).
  const budget = node.type === 'olt' ? null : linkBudget(node, byId)
  const downstream = downstreamIds(node.id, nodes)
  const customerCount = nodes.filter((n) => n.type === 'customer' && downstream.has(n.id)).length
  // Blast radius when this node is down: downstream customers + itself if it is one.
  const impacted = customerCount + (node.type === 'customer' ? 1 : 0)
  const lifecycle = node.type === 'customer' ? node.meta?.lifecycle : undefined

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="min-w-0">
          <CardTitle className="truncate text-base">{node.name}</CardTitle>
          <p className="mt-1 text-muted-foreground text-xs">{TYPE_LABEL[node.type]}</p>
        </div>
        <div className="flex items-center gap-1">
          {node.meta?.maintenance ? <StatusBadge tone="info" label="Pemeliharaan" /> : null}
          {lifecycle ? (
            <StatusBadge tone={LIFECYCLE_TONE[lifecycle]} label={LIFECYCLE_LABEL[lifecycle]} />
          ) : null}
          <StatusBadge tone={STATUS_TONE[node.status]} label={STATUS_LABEL[node.status]} />
          {showClose ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Tutup"
              onClick={onClear}
            >
              <XIcon className="size-4" />
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {node.status === 'down' ? (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
            <TriangleAlertIcon className="size-4 shrink-0 text-destructive" />
            <span className="text-destructive text-xs">
              {impacted > 0
                ? `≈ ${impacted} pelanggan berpotensi terdampak`
                : 'Node ini sedang down'}
            </span>
          </div>
        ) : null}
        <NodeMetaDetails node={node} cableMeters={cableMeters} distanceMeters={distanceMeters} />
        {budget ? <PowerBudget budget={budget} measuredRxDbm={node.meta?.rxPowerDbm} /> : null}
        <Button asChild variant="outline" size="sm" className="h-8 w-full">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${node.lat},${node.lng}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <NavigationIcon className="size-4" />
            Navigasi ke lokasi
          </a>
        </Button>
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

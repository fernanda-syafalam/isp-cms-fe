import { Link } from '@tanstack/react-router'
import { ExternalLinkIcon, PencilIcon, Trash2Icon, TriangleAlertIcon, XIcon } from 'lucide-react'

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
import { Sparkline } from '@/components/shared/sparkline'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { NetworkNode, NodeStatus } from '@/schemas/topology'

import {
  STATUS_LABEL,
  TYPE_LABEL,
  downstreamIds,
  formatLength,
  segmentMeters,
  uplinkPath,
} from '../lib/graph'

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
  const parent = node.parentId ? byId.get(node.parentId) : undefined
  const cableMeters = parent ? segmentMeters(node, parent) : undefined
  const downstream = downstreamIds(node.id, nodes)
  const customerCount = nodes.filter((n) => n.type === 'customer' && downstream.has(n.id)).length
  // Blast radius when this node is down: downstream customers + itself if it is one.
  const impacted = customerCount + (node.type === 'customer' ? 1 : 0)

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
        <NodeMetaDetails node={node} cableMeters={cableMeters} />
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

// Optical RX power health: healthy ≳ −25 dBm, marginal −25…−27, bad < −27.
function rxTone(dbm: number): StatusTone {
  if (dbm >= -25) return 'success'
  if (dbm >= -27) return 'warning'
  return 'danger'
}

// Deterministic 12-point series seeded by node id, so the "last 12 readings"
// sparkline is stable across renders (mock; a real backend would poll).
function metricSeries(seed: string, base: number, amp: number): number[] {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const out: number[] = []
  for (let i = 0; i < 12; i++) {
    h = (h * 1103515245 + 12345) >>> 0
    out.push(Math.round((base + ((h % 1000) / 1000 - 0.5) * amp) * 10) / 10)
  }
  return out
}

// Per-type technical detail + a customer-node link to its subscriber record.
function NodeMetaDetails({
  node,
  cableMeters,
}: {
  node: NetworkNode
  cableMeters?: number | undefined
}) {
  const m = node.meta
  const portPct =
    m?.portsTotal && m.portsTotal > 0 ? Math.round(((m.portsUsed ?? 0) / m.portsTotal) * 100) : null
  // A "last 12 readings" sparkline: utilization for infra, RX power for CPE.
  const spark =
    portPct !== null
      ? {
          label: 'Utilisasi port (12 jam)',
          data: metricSeries(node.id, portPct, 18),
        }
      : typeof m?.rxPowerDbm === 'number'
        ? {
            label: 'Redaman RX (12 jam)',
            data: metricSeries(node.id, m.rxPowerDbm, 2),
          }
        : null

  return (
    <div className="space-y-3 border-border border-t pt-3">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        {m?.model ? (
          <>
            <dt className="text-muted-foreground">Model</dt>
            <dd className="text-right font-medium">{m.model}</dd>
          </>
        ) : null}
        {m?.ipAddress ? (
          <>
            <dt className="text-muted-foreground">IP</dt>
            <dd className="text-right font-mono">{m.ipAddress}</dd>
          </>
        ) : null}
        {m?.splitter ? (
          <>
            <dt className="text-muted-foreground">Splitter</dt>
            <dd className="text-right font-mono">{m.splitter}</dd>
          </>
        ) : null}
        {m?.portsTotal ? (
          <>
            <dt className="text-muted-foreground">Port</dt>
            <dd className="text-right font-mono tabular-nums">
              {m.portsUsed ?? 0}/{m.portsTotal}
            </dd>
          </>
        ) : null}
        {typeof m?.rxPowerDbm === 'number' ? (
          <>
            <dt className="text-muted-foreground">Redaman (RX)</dt>
            <dd className="text-right">
              <StatusBadge tone={rxTone(m.rxPowerDbm)} label={`${m.rxPowerDbm} dBm`} dot={false} />
            </dd>
          </>
        ) : null}
        {typeof m?.uptimePct === 'number' ? (
          <>
            <dt className="text-muted-foreground">Uptime</dt>
            <dd className="text-right font-mono tabular-nums">{m.uptimePct}%</dd>
          </>
        ) : null}
        {m?.planName ? (
          <>
            <dt className="text-muted-foreground">Paket</dt>
            <dd className="text-right font-medium">{m.planName}</dd>
          </>
        ) : null}
        {typeof cableMeters === 'number' ? (
          <>
            <dt className="text-muted-foreground">Panjang kabel</dt>
            <dd className="text-right font-mono tabular-nums">{formatLength(cableMeters)}</dd>
          </>
        ) : null}
        <dt className="text-muted-foreground">Koordinat</dt>
        <dd className="text-right font-mono tabular-nums">
          {node.lat.toFixed(4)}, {node.lng.toFixed(4)}
        </dd>
      </dl>

      {portPct !== null ? (
        <div className="space-y-1">
          <div className="flex justify-between text-muted-foreground text-xs">
            <span>Utilisasi port</span>
            <span>{portPct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${portPct >= 90 ? 'bg-red-500' : portPct >= 70 ? 'bg-amber-500' : 'bg-primary'}`}
              style={{ width: `${Math.max(2, portPct)}%` }}
            />
          </div>
        </div>
      ) : null}

      {spark ? (
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">{spark.label}</p>
          <Sparkline data={spark.data} className="text-primary/70" />
        </div>
      ) : null}

      {m?.customerId ? (
        <Button asChild variant="outline" size="sm" className="h-8 w-full">
          <Link to="/customers/$customerId" params={{ customerId: m.customerId }}>
            <ExternalLinkIcon className="size-4" />
            Buka detail pelanggan
          </Link>
        </Button>
      ) : null}
    </div>
  )
}

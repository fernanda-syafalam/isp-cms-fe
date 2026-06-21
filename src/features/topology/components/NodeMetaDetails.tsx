import { Link } from '@tanstack/react-router'
import { ExternalLinkIcon, MessageCircleIcon, PhoneIcon } from 'lucide-react'

import { Sparkline } from '@/components/shared/sparkline'
import { Button } from '@/components/ui/button'
import type { NetworkNode } from '@/schemas/topology'

import { telNumber, waNumber } from '../lib/phone'
import { NodeMetaDl } from './NodeMetaDl'

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
export function NodeMetaDetails({
  node,
  cableMeters,
  distanceMeters,
}: {
  node: NetworkNode
  cableMeters?: number | undefined
  distanceMeters?: number | undefined
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
      <NodeMetaDl node={node} cableMeters={cableMeters} distanceMeters={distanceMeters} />

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

      {m?.phone ? (
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-9 flex-1">
            <a href={`tel:${telNumber(m.phone)}`}>
              <PhoneIcon className="size-4" />
              Telepon
            </a>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-9 flex-1">
            <a
              href={`https://wa.me/${waNumber(m.phone)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircleIcon className="size-4" />
              WhatsApp
            </a>
          </Button>
        </div>
      ) : null}

      {m?.customerId ? (
        <Button asChild variant="outline" size="sm" className="h-9 w-full">
          <Link to="/customers/$customerId" params={{ customerId: m.customerId }}>
            <ExternalLinkIcon className="size-4" />
            Buka detail pelanggan
          </Link>
        </Button>
      ) : null}
    </div>
  )
}

import { Link } from '@tanstack/react-router'
import { ExternalLinkIcon, MessageCircleIcon, PhoneIcon } from 'lucide-react'

import { Sparkline } from '@/components/shared/sparkline'
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import type { NetworkNode } from '@/schemas/topology'

import { type RxHealth, fiberId, formatLength, rxHealth } from '../lib/graph'
import { telNumber, waNumber } from '../lib/phone'

// Map the optical RX health band (incl. overload = too hot) to a pill tone+label.
const RX_TONE: Record<RxHealth, StatusTone> = {
  overload: 'danger',
  good: 'success',
  marginal: 'warning',
  critical: 'danger',
}
const RX_LABEL: Record<RxHealth, string> = {
  overload: 'overload',
  good: 'sehat',
  marginal: 'marginal',
  critical: 'kritis',
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
        {node.type === 'odp' && m?.portsTotal ? (
          <>
            <dt className="text-muted-foreground">Port tersisa</dt>
            <dd className="text-right font-mono tabular-nums">
              {m.portsTotal - (m.portsUsed ?? 0)}
            </dd>
            <dt className="text-muted-foreground">Core berikutnya</dt>
            <dd className="flex items-center justify-end gap-1.5 text-right">
              {(m.portsUsed ?? 0) < m.portsTotal ? (
                <>
                  <span
                    className="size-3 shrink-0 rounded-full border border-border"
                    style={{
                      background: fiberId((m.portsUsed ?? 0) + 1).core.hex,
                    }}
                  />
                  <span>
                    #{(m.portsUsed ?? 0) + 1} {fiberId((m.portsUsed ?? 0) + 1).core.name}
                  </span>
                </>
              ) : (
                <span className="text-destructive">Penuh</span>
              )}
            </dd>
          </>
        ) : null}
        {typeof m?.rxPowerDbm === 'number' ? (
          <>
            <dt className="text-muted-foreground">Redaman (RX)</dt>
            <dd className="text-right">
              <StatusBadge
                tone={RX_TONE[rxHealth(m.rxPowerDbm)]}
                label={`${m.rxPowerDbm} dBm · ${RX_LABEL[rxHealth(m.rxPowerDbm)]}`}
                dot={false}
              />
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
        {m?.onuSerial ? (
          <>
            <dt className="text-muted-foreground">ONU serial</dt>
            <dd className="text-right font-mono">{m.onuSerial}</dd>
          </>
        ) : null}
        {m?.ponPort ? (
          <>
            <dt className="text-muted-foreground">Port PON</dt>
            <dd className="text-right font-mono">{m.ponPort}</dd>
          </>
        ) : null}
        {m?.coreNo ? (
          <>
            <dt className="text-muted-foreground">Tube</dt>
            <dd className="flex items-center justify-end gap-1.5 text-right">
              <span
                className="size-3 shrink-0 rounded-full border border-border"
                style={{ background: fiberId(m.coreNo).tube.hex }}
              />
              <span>
                #{fiberId(m.coreNo).tubeNo} {fiberId(m.coreNo).tube.name}
              </span>
            </dd>
            <dt className="text-muted-foreground">Core (inti)</dt>
            <dd className="flex items-center justify-end gap-1.5 text-right">
              <span
                className="size-3 shrink-0 rounded-full border border-border"
                style={{ background: fiberId(m.coreNo).core.hex }}
              />
              <span>
                #{fiberId(m.coreNo).coreNo} {fiberId(m.coreNo).core.name}
              </span>
            </dd>
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
        {typeof distanceMeters === 'number' ? (
          <>
            <dt className="text-muted-foreground">Jarak dari Anda</dt>
            <dd className="text-right font-mono tabular-nums">{formatLength(distanceMeters)}</dd>
          </>
        ) : null}
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

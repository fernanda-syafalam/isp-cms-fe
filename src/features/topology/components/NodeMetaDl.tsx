import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'
import type { NetworkNode } from '@/schemas/topology'

import { fiberId, formatLength, type RxHealth, rxHealth } from '../lib/graph'

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

type Props = {
  node: NetworkNode
  cableMeters?: number | undefined
  distanceMeters?: number | undefined
}

// The per-type technical detail list (model/IP/ports/optics/fiber/coords).
export function NodeMetaDl({ node, cableMeters, distanceMeters }: Props) {
  const m = node.meta
  return (
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
          <dd className="text-right font-mono tabular-nums">{m.portsTotal - (m.portsUsed ?? 0)}</dd>
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
  )
}

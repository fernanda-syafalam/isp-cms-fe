import { StatusBadge, type StatusTone } from '@/components/shared/status-badge'

import { type LinkBudget, rxHealth } from '../lib/graph'

// GPON link budget panel: estimated end-to-end loss vs the Class B+ 28 dB
// budget, with remaining margin — the check a field tech runs before blaming
// the ONT. <3 dB margin = danger (likely link failure), <6 dB = tight. When the
// ONU reports a measured RX, it is compared to the predicted RX to surface a
// fault the budget can't model (dirty connector, macrobend, bad drop splice).
export function PowerBudget({
  budget,
  measuredRxDbm,
}: {
  budget: LinkBudget
  measuredRxDbm?: number | undefined
}) {
  const tone: StatusTone =
    budget.marginDb < 3 ? 'danger' : budget.marginDb < 6 ? 'warning' : 'success'
  const usedPct = Math.min(100, Math.round((budget.lossDb / budget.budgetDb) * 100))
  const barClass =
    tone === 'danger' ? 'bg-red-500' : tone === 'warning' ? 'bg-amber-500' : 'bg-green-600'
  const rx = resolveRxDiagnosis(budget.predictedRxDbm, measuredRxDbm)
  return (
    <div className="space-y-2 border-border border-t pt-3">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">Power budget (estimasi)</span>
        <StatusBadge tone={tone} label={`margin ${budget.marginDb} dB`} dot={false} />
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${usedPct}%` }} />
      </div>
      <p className="text-muted-foreground text-xs">
        Loss ≈ <span className="font-mono">{budget.lossDb} dB</span> dari budget{' '}
        <span className="font-mono">{budget.budgetDb} dB</span> (Class B+).
      </p>
      <p className="text-muted-foreground text-xs">
        RX prediksi ≈ <span className="font-mono">{budget.predictedRxDbm} dBm</span>
        {rx ? (
          <>
            {' · terukur '}
            <span className="font-mono">{rx.measured} dBm</span>
            {' (Δ '}
            <span className="font-mono">
              {rx.delta >= 0 ? '+' : ''}
              {rx.delta} dB
            </span>
            {')'}
          </>
        ) : null}
      </p>
      {rx?.hint ? <p className={`text-xs ${rx.hintClass}`}>{rx.hint}</p> : null}
    </div>
  )
}

type RxDiagnosis = {
  measured: number
  delta: number
  hint: string | null
  hintClass: string
}

// Diagnose measured-vs-predicted RX: overload (too hot), a reading ≥3 dB below
// prediction (likely a drop fault), or in line with the estimate.
export function resolveRxDiagnosis(
  predicted: number,
  measured?: number | undefined,
): RxDiagnosis | null {
  if (measured === undefined) return null
  const delta = Math.round((measured - predicted) * 10) / 10
  if (rxHealth(measured) === 'overload') {
    return {
      measured,
      delta,
      hint: 'RX terlalu kuat (overload) — pasang atenuator.',
      hintClass: 'text-destructive',
    }
  }
  if (delta <= -3) {
    return {
      measured,
      delta,
      hint: `≈ ${Math.abs(delta)} dB di bawah prediksi — cek konektor/sambungan drop.`,
      hintClass: 'text-amber-600',
    }
  }
  return { measured, delta, hint: null, hintClass: '' }
}

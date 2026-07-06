import { GaugeIcon } from 'lucide-react'

import { Sparkline } from '@/components/shared/sparkline'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber } from '@/lib/format'
import type { PortalUsage } from '@/schemas/portal'

import { usePortalUsage } from '../hooks/usePortal'

// Self-care usage card: quota bar (usedGb/quotaGb), 7-day trend, FUP badge.
export function UsageQuotaCard() {
  const { data, isLoading, isError } = usePortalUsage()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GaugeIcon className="size-4 text-muted-foreground" />
          Pemakaian data
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : isError || !data ? (
          <p className="py-6 text-center text-muted-foreground text-sm" role="alert">
            Gagal memuat data pemakaian.
          </p>
        ) : (
          <UsageBody usage={data} />
        )}
      </CardContent>
    </Card>
  )
}

function UsageBody({ usage }: { usage: PortalUsage }) {
  const isUnlimited = usage.quotaGb === 0
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((usage.usedGb / usage.quotaGb) * 100))
  const barTone = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-primary'
  const total = usage.trend.reduce((sum, v) => sum + v, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-semibold text-lg tabular-nums">
          {formatNumber(usage.usedGb)} GB{' '}
          <span className="font-normal text-muted-foreground text-sm">
            {isUnlimited ? 'terpakai' : `dari ${formatNumber(usage.quotaGb)} GB`}
          </span>
        </p>
        {usage.fupThrottled ? (
          <StatusBadge tone="warning" label="FUP (dibatasi)" />
        ) : (
          <StatusBadge tone="success" label="Normal" />
        )}
      </div>

      {isUnlimited ? (
        <p className="text-muted-foreground text-sm">Paket {usage.planName} — kuota tanpa batas.</p>
      ) : (
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Pemakaian kuota ${pct}%`}
        >
          <div
            className={`h-full rounded-full ${barTone}`}
            style={{ width: `${Math.max(2, pct)}%` }}
          />
        </div>
      )}

      {usage.trend.length > 1 ? (
        <div className="flex items-end justify-between gap-4 border-border border-t pt-3">
          <div>
            <p className="text-muted-foreground text-xs">Tren 7 hari terakhir</p>
            <p className="font-mono font-semibold tabular-nums">{formatNumber(total)} GB</p>
          </div>
          <Sparkline data={usage.trend} className="h-10 w-32 text-primary" />
        </div>
      ) : null}
    </div>
  )
}

import { Link } from '@tanstack/react-router'
import { GaugeIcon, HeartPulseIcon, SmilePlusIcon } from 'lucide-react'

import { ErrorState } from '@/components/shared/error-state'
import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/lib/format'
import type { Satisfaction } from '@/schemas/satisfaction'

import { useSatisfaction } from '../hooks/useSatisfaction'

const stars = (rating: number) => '★★★★★'.slice(0, rating) + '☆☆☆☆☆'.slice(0, 5 - rating)

export function SatisfactionPage() {
  const { data, isLoading, isError, refetch } = useSatisfaction()

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Kepuasan & Churn" />
        <ErrorState title="Gagal memuat data kepuasan." onRetry={() => refetch()} />
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Kepuasan & Churn" description="CSAT, NPS, dan risiko churn." />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kepuasan & Churn"
        description="CSAT pasca-tiket, Net Promoter Score, dan risiko churn pelanggan."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="CSAT"
          value={data.csat.avg}
          format={(v) => `${v.toFixed(1)} / 5`}
          hint={`${data.csat.count} respons`}
          icon={SmilePlusIcon}
        />
        <KpiCard
          label="NPS"
          value={data.nps.score}
          hint={`${data.nps.total} responden`}
          hintTone={data.nps.score >= 0 ? 'positive' : 'negative'}
          icon={HeartPulseIcon}
        />
        <KpiCard
          label="Churn rate"
          value={data.churn.rate}
          format={(v) => `${v.toFixed(1)}%`}
          hint="periode berjalan"
          hintTone="negative"
          icon={GaugeIcon}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <NpsBreakdown nps={data.nps} />
        <AtRiskList atRisk={data.churn.atRisk} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Umpan balik terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentFeedback.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground text-sm">Belum ada umpan balik.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.recentFeedback.map((f) => (
                <li key={f.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm">
                      <CustomerName id={f.customerId} name={f.customerName} />{' '}
                      <span
                        className="text-amber-500"
                        role="img"
                        aria-label={`Rating ${f.rating} dari 5`}
                      >
                        {stars(f.rating)}
                      </span>
                    </p>
                    <p className="text-muted-foreground text-xs">{f.comment}</p>
                  </div>
                  <span className="shrink-0 text-muted-foreground text-xs">
                    {formatDateTime(f.at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function NpsBreakdown({ nps }: { nps: Satisfaction['nps'] }) {
  const pct = (n: number) => (nps.total > 0 ? Math.round((n / nps.total) * 100) : 0)
  const rows = [
    { label: 'Promoter (9–10)', value: nps.promoters, cls: 'bg-green-500' },
    { label: 'Pasif (7–8)', value: nps.passives, cls: 'bg-amber-500' },
    { label: 'Detraktor (0–6)', value: nps.detractors, cls: 'bg-red-500' },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distribusi NPS</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex justify-between text-xs">
              <span>{r.label}</span>
              <span className="text-muted-foreground">
                {r.value} ({pct(r.value)}%)
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${r.cls}`}
                style={{ width: `${pct(r.value)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function AtRiskList({ atRisk }: { atRisk: Satisfaction['churn']['atRisk'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pelanggan berisiko churn</CardTitle>
      </CardHeader>
      <CardContent>
        {atRisk.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-sm">
            Tidak ada pelanggan berisiko. ✅
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {atRisk.map((c) => (
              <li key={c.customerName} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">
                    <CustomerName id={c.customerId} name={c.customerName} />
                  </p>
                  <p className="text-muted-foreground text-xs">{c.reason}</p>
                </div>
                <StatusBadge
                  tone={c.riskPct >= 70 ? 'danger' : 'warning'}
                  label={`${c.riskPct}%`}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

// Customer name as a link to its detail when the id is known, else plain text.
function CustomerName({ id, name }: { id?: string | undefined; name: string }) {
  if (!id) return <span className="font-medium">{name}</span>
  return (
    <Link
      to="/customers/$customerId"
      params={{ customerId: id }}
      className="font-medium hover:underline"
    >
      {name}
    </Link>
  )
}

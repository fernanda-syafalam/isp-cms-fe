import { BanknoteIcon, LifeBuoyIcon, RouterIcon, TriangleAlertIcon, UsersIcon } from 'lucide-react'

import { KpiCard } from '@/components/shared/kpi-card'
import { RevenueChart } from '@/components/shared/revenue-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardSummary } from '@/hooks/useAnalytics'
import { useCurrentUser } from '@/features/auth'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'

const KPI_SKELETON_KEYS = ['k1', 'k2', 'k3', 'k4'] as const

export function DashboardPage() {
  const { data: user } = useCurrentUser()
  const { data: summary, isLoading, isError } = useDashboardSummary()

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-bold text-3xl tracking-tight">
          Welcome{user ? `, ${user.fullName}` : ''}
        </h1>
        <p className="mt-2 text-muted-foreground">Network, billing, and support at a glance.</p>
      </header>

      {isError ? (
        <p className="text-destructive" role="alert">
          Failed to load dashboard metrics.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading || !summary
          ? KPI_SKELETON_KEYS.map((k) => <Skeleton key={k} className="h-28 w-full rounded-xl" />)
          : null}
        {summary ? (
          <>
            <KpiCard
              label="Active subscribers"
              value={formatNumber(summary.activeSubscribers)}
              hint={`+${formatNumber(summary.newThisMonth)} this month`}
              hintTone={summary.newThisMonth >= 0 ? 'positive' : 'negative'}
              icon={UsersIcon}
            />
            <KpiCard
              label="MRR"
              value={formatCurrency(summary.mrr)}
              hint="Recurring monthly revenue"
              icon={BanknoteIcon}
            />
            <KpiCard
              label="Overdue"
              value={formatCurrency(summary.overdueAmount)}
              hint={`${formatNumber(summary.overdueCount)} invoices`}
              hintTone="negative"
              icon={TriangleAlertIcon}
            />
            <KpiCard
              label="Open tickets"
              value={formatNumber(summary.openTickets)}
              hint={`SLA ${formatPercent(summary.slaCompliance)}`}
              icon={LifeBuoyIcon}
            />
          </>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenue (last 6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            {summary ? (
              <RevenueChart data={summary.revenueTrend} />
            ) : (
              <Skeleton className="h-[280px] w-full" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Network status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary ? (
              <NetworkStatus online={summary.devicesOnline} total={summary.devicesTotal} />
            ) : (
              <Skeleton className="h-24 w-full" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function NetworkStatus({ online, total }: { online: number; total: number }) {
  const offline = Math.max(0, total - online)
  const ratio = total > 0 ? online / total : 0
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <RouterIcon className="size-5" />
        </span>
        <div>
          <p className="font-bold text-2xl tracking-tight">{formatPercent(ratio)}</p>
          <p className="text-muted-foreground text-xs">devices online</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-md bg-muted p-2">
          <dt className="text-muted-foreground text-xs">Online</dt>
          <dd className="font-medium text-emerald-600 dark:text-emerald-400">
            {formatNumber(online)}
          </dd>
        </div>
        <div className="rounded-md bg-muted p-2">
          <dt className="text-muted-foreground text-xs">Offline</dt>
          <dd className="font-medium text-red-600 dark:text-red-400">{formatNumber(offline)}</dd>
        </div>
      </dl>
    </div>
  )
}

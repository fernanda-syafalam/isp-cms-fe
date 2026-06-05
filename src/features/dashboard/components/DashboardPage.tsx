import { BanknoteIcon, PowerOffIcon, RouterIcon, TriangleAlertIcon, UsersIcon } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

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
          Selamat datang{user ? `, ${user.fullName}` : ''}
        </h1>
        <p className="mt-2 text-muted-foreground">Jaringan, tagihan, dan dukungan sekilas.</p>
      </header>

      {isError ? (
        <p className="text-destructive" role="alert">
          Gagal memuat metrik dasbor.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading || !summary
          ? KPI_SKELETON_KEYS.map((k) => <Skeleton key={k} className="h-28 w-full rounded-xl" />)
          : null}
        {summary ? (
          <>
            <KpiCard
              label="Pelanggan aktif"
              value={summary.activeSubscribers}
              hint={`+${formatNumber(summary.newThisMonth)} bulan ini`}
              hintTone={summary.newThisMonth >= 0 ? 'positive' : 'negative'}
              icon={UsersIcon}
            />
            <KpiCard
              label="Terisolir"
              value={summary.isolatedSubscribers}
              hint="pelanggan diisolir"
              hintTone="negative"
              icon={PowerOffIcon}
            />
            <KpiCard
              label="MRR"
              value={summary.mrr}
              format={formatCurrency}
              hint="Pendapatan bulanan berulang"
              accent="amber"
              icon={BanknoteIcon}
              series={summary.revenueTrend.map((r) => r.revenue)}
            />
            <KpiCard
              label="Piutang (AR)"
              value={summary.arOutstanding}
              format={formatCurrency}
              hint={`${formatNumber(summary.overdueCount)} tagihan telat`}
              hintTone="negative"
              icon={TriangleAlertIcon}
            />
          </>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Pendapatan (6 bulan terakhir)</CardTitle>
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
            <CardTitle className="text-base">Status jaringan</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tiket per status</CardTitle>
        </CardHeader>
        <CardContent>
          {summary ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={summary.ticketsByStatus}
                layout="vertical"
                margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={96}
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'var(--color-muted)' }}
                  contentStyle={{
                    background: 'var(--color-popover)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    color: 'var(--color-popover-foreground)',
                  }}
                />
                <Bar
                  dataKey="count"
                  name="Tiket"
                  fill="var(--color-chart-1)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Skeleton className="h-[220px] w-full" />
          )}
        </CardContent>
      </Card>
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
          <p className="text-muted-foreground text-xs">perangkat online</p>
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

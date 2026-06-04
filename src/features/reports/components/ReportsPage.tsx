import { TrendingDownIcon, WalletIcon } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { RevenueChart } from '@/components/shared/revenue-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useReportsSummary } from '@/hooks/useAnalytics'
import { formatCurrency, formatPercent } from '@/lib/format'

export function ReportsPage() {
  const { data: summary, isLoading, isError } = useReportsSummary()

  return (
    <div className="space-y-8">
      <PageHeader title="Laporan" description="Analitik pendapatan, pertumbuhan, dan churn." />

      {isError ? (
        <p className="text-destructive" role="alert">
          Gagal memuat laporan.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {isLoading || !summary ? (
          <>
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </>
        ) : (
          <>
            <KpiCard
              label="ARPU"
              value={formatCurrency(summary.arpu)}
              hint="Rata-rata pendapatan per pelanggan"
              icon={WalletIcon}
            />
            <KpiCard
              label="Tingkat churn"
              value={formatPercent(summary.churnRate)}
              hint="Pelanggan hilang bulan ini"
              hintTone="negative"
              icon={TrendingDownIcon}
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tren pendapatan</CardTitle>
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
          <CardTitle className="text-base">Pelanggan baru vs churn</CardTitle>
        </CardHeader>
        <CardContent>
          {summary ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={summary.movement} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-popover)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    color: 'var(--color-popover-foreground)',
                  }}
                />
                <Legend />
                <Bar
                  dataKey="added"
                  name="Baru"
                  fill="var(--color-chart-2)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="churned"
                  name="Churn"
                  fill="var(--color-chart-5)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Skeleton className="h-[280px] w-full" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

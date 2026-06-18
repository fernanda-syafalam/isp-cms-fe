import { BanknoteIcon, CoinsIcon, TrendingDownIcon, UsersIcon, WalletIcon } from 'lucide-react'
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
import { useDashboardSummary, useReportsSummary } from '@/hooks/useAnalytics'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'

import { useCustomerComposition } from '../hooks/useCustomerComposition'

export function ReportsPage() {
  const { data: reports, isError, isLoading: reportsLoading } = useReportsSummary()
  const { data: dashboard, isLoading: dashboardLoading } = useDashboardSummary()
  const { data: composition } = useCustomerComposition()

  // The KPI strip spans two analytics queries; show loading/error until both
  // settle so cards never flash fake zeros or skeleton forever on failure.
  const isLoading = reportsLoading || dashboardLoading

  return (
    <div className="space-y-8">
      <PageHeader title="Laporan" description="Analitik pendapatan, pertumbuhan, dan pelanggan." />

      {isError ? (
        <p className="text-destructive" role="alert">
          Gagal memuat laporan.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="MRR"
          value={dashboard?.mrr ?? 0}
          format={formatCurrency}
          hint="Pendapatan bulanan berulang"
          accent="amber"
          icon={BanknoteIcon}
          series={dashboard?.revenueTrend.map((r) => r.revenue) ?? []}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Pelanggan aktif"
          value={dashboard?.activeSubscribers ?? 0}
          hint={`+${formatNumber(dashboard?.newThisMonth ?? 0)} bulan ini`}
          hintTone="positive"
          icon={UsersIcon}
          series={dashboard?.subscriberTrend ?? []}
          to="/customers"
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Piutang (AR)"
          value={dashboard?.arOutstanding ?? 0}
          format={formatCurrency}
          hint={`${formatNumber(dashboard?.overdueCount ?? 0)} tagihan telat`}
          hintTone="negative"
          icon={WalletIcon}
          series={dashboard?.arTrend ?? []}
          to="/invoices"
          search={{ status: 'overdue' }}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="ARPU"
          value={reports?.arpu ?? 0}
          format={formatCurrency}
          hint="Pendapatan per pelanggan"
          icon={CoinsIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Tingkat churn"
          value={reports?.churnRate ?? 0}
          format={formatPercent}
          hint="Pelanggan hilang bulan ini"
          hintTone="negative"
          icon={TrendingDownIcon}
          isLoading={isLoading}
          isError={isError}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Tren pendapatan</CardTitle>
          </CardHeader>
          <CardContent>
            {reports ? (
              <RevenueChart data={reports.revenueTrend} />
            ) : (
              <Skeleton className="h-[280px] w-full" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Komposisi pelanggan</CardTitle>
          </CardHeader>
          <CardContent>
            {composition ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={composition}
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
                    tick={{
                      fill: 'var(--color-muted-foreground)',
                      fontSize: 12,
                    }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={80}
                    tick={{
                      fill: 'var(--color-muted-foreground)',
                      fontSize: 12,
                    }}
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
                    name="Pelanggan"
                    fill="var(--color-chart-1)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-[280px] w-full" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pelanggan baru vs churn</CardTitle>
        </CardHeader>
        <CardContent>
          {reports ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={reports.movement} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
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

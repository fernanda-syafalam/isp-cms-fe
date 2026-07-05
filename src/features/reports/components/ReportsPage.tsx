import { BanknoteIcon, CoinsIcon, TrendingDownIcon, UsersIcon, WalletIcon } from 'lucide-react'
import { useState } from 'react'

import { FilterTabs, type FilterTabItem } from '@/components/shared/filter-tabs'
import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { RevenueChart } from '@/components/shared/revenue-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardSummary, useReportsSummary } from '@/hooks/useAnalytics'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'

import { useCustomerComposition } from '../hooks/useCustomerComposition'
import { CustomerCompositionChart } from './CustomerCompositionChart'
import { MovementChart } from './MovementChart'

const PERIOD_TABS: FilterTabItem[] = [
  { value: '3', label: '3 bulan' },
  { value: '6', label: '6 bulan' },
  { value: '12', label: '12 bulan' },
]

export function ReportsPage() {
  const [months, setMonths] = useState('6')
  const { data: reports, isError, isLoading: reportsLoading } = useReportsSummary(Number(months))
  const { data: dashboard, isLoading: dashboardLoading } = useDashboardSummary()
  const { data: composition } = useCustomerComposition()

  // The KPI strip spans two analytics queries; show loading/error until both
  // settle so cards never flash fake zeros or skeleton forever on failure.
  const isLoading = reportsLoading || dashboardLoading

  return (
    <div className="space-y-8">
      <PageHeader
        title="Laporan"
        description="Analitik pendapatan, pertumbuhan, dan pelanggan."
        actions={
          <FilterTabs
            ariaLabel="Rentang periode laporan"
            value={months}
            onValueChange={setMonths}
            items={PERIOD_TABS}
          />
        }
      />

      {isError ? (
        <p className="text-destructive" role="alert">
          Gagal memuat laporan.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="MRR"
          estimated
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
          estimated
          value={reports?.arpu ?? 0}
          format={formatCurrency}
          hint="Pendapatan per pelanggan"
          icon={CoinsIcon}
          isLoading={isLoading}
          isError={isError}
        />
        <KpiCard
          label="Tingkat churn"
          estimated
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
            <CustomerCompositionChart data={composition} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pelanggan baru vs churn</CardTitle>
        </CardHeader>
        <CardContent>
          <MovementChart data={reports?.movement} />
        </CardContent>
      </Card>
    </div>
  )
}

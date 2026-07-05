import { BanknoteIcon, PowerOffIcon, TriangleAlertIcon, UsersIcon } from 'lucide-react'

import { KpiCard } from '@/components/shared/kpi-card'
import { formatCurrency, formatNumber } from '@/lib/format'
import type { DashboardSummary } from '@/schemas/analytics'

type Props = {
  summary: DashboardSummary | undefined
  isLoading: boolean
  isError: boolean
}

// Headline KPI row: active subscribers, isolated, MRR, and AR outstanding.
export function DashboardKpis({ summary, isLoading, isError }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Pelanggan aktif"
        value={summary?.activeSubscribers ?? 0}
        hint={`+${formatNumber(summary?.newThisMonth ?? 0)} bulan ini`}
        hintTone={(summary?.newThisMonth ?? 0) >= 0 ? 'positive' : 'negative'}
        icon={UsersIcon}
        series={summary?.subscriberTrend ?? []}
        to="/customers"
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Terisolir"
        value={summary?.isolatedSubscribers ?? 0}
        hint="pelanggan diisolir"
        hintTone="negative"
        icon={PowerOffIcon}
        series={summary?.isolatedTrend ?? []}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="MRR"
        estimated
        value={summary?.mrr ?? 0}
        format={formatCurrency}
        hint="Pendapatan bulanan berulang"
        accent="amber"
        icon={BanknoteIcon}
        series={summary?.revenueTrend.map((r) => r.revenue) ?? []}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Piutang (AR)"
        value={summary?.arOutstanding ?? 0}
        format={formatCurrency}
        hint={`${formatNumber(summary?.overdueCount ?? 0)} tagihan telat`}
        hintTone="negative"
        icon={TriangleAlertIcon}
        series={summary?.arTrend ?? []}
        to="/invoices"
        search={{ status: 'overdue' }}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  )
}

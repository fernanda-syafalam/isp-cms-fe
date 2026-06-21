import { ActivityIcon, GaugeIcon, TriangleAlertIcon } from 'lucide-react'

import { KpiCard } from '@/components/shared/kpi-card'
import { formatNumber } from '@/lib/format'
import type { UsageSummary } from '@/schemas/usage'

type Props = {
  summary: UsageSummary | undefined
  isLoading: boolean
  isError: boolean
}

// Full-set KPI row for data usage (total / throttled / average per subscriber).
export function UsageKpis({ summary, isLoading, isError }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <KpiCard
        label="Total pemakaian"
        value={summary?.totalUsedGb ?? 0}
        format={(v) => `${formatNumber(v)} GB`}
        hint="periode berjalan"
        icon={ActivityIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Kena FUP"
        value={summary?.throttled ?? 0}
        hint="pelanggan dibatasi"
        hintTone="negative"
        icon={TriangleAlertIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Rata-rata / pelanggan"
        value={summary?.avgUsedGb ?? 0}
        format={(v) => `${formatNumber(v)} GB`}
        icon={GaugeIcon}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  )
}

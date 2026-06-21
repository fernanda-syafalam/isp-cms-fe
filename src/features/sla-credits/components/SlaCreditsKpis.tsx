import { CheckIcon, HandCoinsIcon, WalletIcon } from 'lucide-react'

import { KpiCard } from '@/components/shared/kpi-card'
import { formatCurrency } from '@/lib/format'
import type { SlaCreditSummary } from '@/schemas/slaCredit'

type Props = {
  summary: SlaCreditSummary | undefined
  isLoading: boolean
  isError: boolean
}

// Full-set KPI row for SLA credits (active amount / pending / applied).
export function SlaCreditsKpis({ summary, isLoading, isError }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <KpiCard
        label="Total kredit aktif"
        value={summary?.activeAmount ?? 0}
        format={formatCurrency}
        icon={WalletIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Menunggu"
        value={summary?.pending ?? 0}
        hint="belum diterapkan"
        hintTone="negative"
        icon={HandCoinsIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Diterapkan"
        value={summary?.applied ?? 0}
        hintTone="positive"
        icon={CheckIcon}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  )
}

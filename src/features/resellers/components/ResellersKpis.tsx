import { CheckCircle2Icon, PowerOffIcon, StoreIcon, WalletIcon } from 'lucide-react'

import { KpiCard } from '@/components/shared/kpi-card'
import { formatCurrency } from '@/lib/format'
import type { ResellerSummary } from '@/schemas/reseller'

type Props = {
  summary: ResellerSummary | undefined
  isLoading: boolean
  isError: boolean
}

// Full-set KPI row for resellers (total / active / inactive / total balance).
export function ResellersKpis({ summary, isLoading, isError }: Props) {
  const by = summary?.byStatus
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Total reseller"
        value={summary?.total ?? 0}
        hint="mitra terdaftar"
        icon={StoreIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Aktif"
        value={by?.active ?? 0}
        hint="berjualan"
        icon={CheckCircle2Icon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Nonaktif"
        value={by?.inactive ?? 0}
        hint="dinonaktifkan"
        icon={PowerOffIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Total saldo"
        value={summary?.totalBalance ?? 0}
        format={formatCurrency}
        hint="deposit komisi"
        icon={WalletIcon}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  )
}

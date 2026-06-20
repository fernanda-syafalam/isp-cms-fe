import { PowerOffIcon, UsersIcon, WalletIcon, WifiIcon } from 'lucide-react'

import { KpiCard } from '@/components/shared/kpi-card'
import { formatCurrency } from '@/lib/format'
import type { CustomerSummary } from '@/schemas/customer'

type Props = {
  summary: CustomerSummary | undefined
  isLoading: boolean
  isError: boolean
}

// Full-set KPI row for the customer list — counts are scope-wide (stable across
// the status tabs), so they live next to the table rather than per-page.
export function CustomersKpis({ summary, isLoading, isError }: Props) {
  const by = summary?.byStatus
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Total pelanggan"
        value={summary?.total ?? 0}
        hint="dalam cakupan"
        icon={UsersIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Aktif"
        value={by?.aktif ?? 0}
        hint="berlangganan"
        hintTone="positive"
        icon={WifiIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Terisolir"
        value={by?.isolir ?? 0}
        hint="diisolir karena menunggak"
        hintTone="negative"
        icon={PowerOffIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Piutang (AR)"
        value={summary?.outstanding ?? 0}
        format={formatCurrency}
        hint="total tunggakan"
        accent="amber"
        icon={WalletIcon}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  )
}

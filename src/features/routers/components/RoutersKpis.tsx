import { RouterIcon, WifiIcon, WifiOffIcon } from 'lucide-react'

import { KpiCard } from '@/components/shared/kpi-card'
import type { RouterList } from '@/schemas/router'

type Props = {
  summary: RouterList['summary'] | undefined
  isLoading: boolean
  isError: boolean
}

// Full-set KPI row for routers (total / online / offline).
export function RoutersKpis({ summary, isLoading, isError }: Props) {
  const by = summary?.byStatus
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <KpiCard
        label="Total router"
        value={summary?.total ?? 0}
        hint="Mikrotik terhubung"
        icon={RouterIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Online"
        value={by?.online ?? 0}
        hint="aktif"
        icon={WifiIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Offline"
        value={by?.offline ?? 0}
        hint="tidak tersinkron"
        hintTone="negative"
        icon={WifiOffIcon}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  )
}

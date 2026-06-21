import { RouterIcon, WifiIcon, WifiOffIcon } from 'lucide-react'

import { KpiCard } from '@/components/shared/kpi-card'
import type { AcsSummary } from '@/schemas/acs'

type Props = {
  summary: AcsSummary | undefined
  isLoading: boolean
  isError: boolean
}

// Full-set KPI row for ACS/CPE devices (total / online / offline).
export function AcsKpis({ summary, isLoading, isError }: Props) {
  const by = summary?.byStatus
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <KpiCard
        label="Total CPE"
        value={summary?.total ?? 0}
        hint="perangkat terdaftar"
        icon={RouterIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Online"
        value={by?.online ?? 0}
        hint="terhubung"
        icon={WifiIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Offline"
        value={by?.offline ?? 0}
        hint="tidak inform"
        hintTone="negative"
        icon={WifiOffIcon}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  )
}

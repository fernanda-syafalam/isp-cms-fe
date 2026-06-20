import { CheckCircle2Icon, ServerIcon, TriangleAlertIcon, WifiOffIcon } from 'lucide-react'

import { KpiCard } from '@/components/shared/kpi-card'
import type { DeviceSummary } from '@/schemas/device'

type Props = {
  summary: DeviceSummary | undefined
  isLoading: boolean
  isError: boolean
}

// Full-set KPI row for the device fleet (total / online / degraded / offline).
export function DevicesKpis({ summary, isLoading, isError }: Props) {
  const by = summary?.byStatus
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Total perangkat"
        value={summary?.total ?? 0}
        hint="OLT / ONU / Mikrotik"
        icon={ServerIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Online"
        value={by?.online ?? 0}
        hint="sehat"
        icon={CheckCircle2Icon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Menurun"
        value={by?.degraded ?? 0}
        hint="perlu perhatian"
        accent="amber"
        icon={TriangleAlertIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Offline"
        value={by?.offline ?? 0}
        hint="tidak terjangkau"
        hintTone="negative"
        icon={WifiOffIcon}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  )
}

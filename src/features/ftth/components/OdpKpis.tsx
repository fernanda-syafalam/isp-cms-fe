import { NetworkIcon, PlugZapIcon, SignalIcon } from 'lucide-react'

import { KpiCard } from '@/components/shared/kpi-card'
import type { OdpSummary } from '@/schemas/odp'

type Props = {
  summary: OdpSummary | undefined
  isLoading: boolean
  isError: boolean
}

// Full-set KPI row for ODP capacity/health (total / utilization / full / optical).
export function OdpKpis({ summary, isLoading, isError }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Total ODP"
        value={summary?.totalOdp ?? 0}
        icon={NetworkIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Utilisasi port"
        value={summary?.utilization ?? 0}
        format={(v) => `${v}%`}
        hint="terpakai"
        accent="amber"
        icon={PlugZapIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="ODP penuh"
        value={summary?.full ?? 0}
        hint="tanpa slot kosong"
        hintTone="negative"
        icon={PlugZapIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Optik bermasalah"
        value={summary?.optical ?? 0}
        hint="redaman tinggi"
        hintTone="negative"
        icon={SignalIcon}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  )
}

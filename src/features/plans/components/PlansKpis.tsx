import { ArchiveIcon, CheckCircle2Icon, PackageIcon, UsersIcon } from 'lucide-react'

import { KpiCard } from '@/components/shared/kpi-card'
import type { PlanSummary } from '@/schemas/plan'

type Props = {
  summary: PlanSummary | undefined
  isLoading: boolean
  isError: boolean
}

// Full-set KPI row for service plans (total / active / archived / subscribers).
export function PlansKpis({ summary, isLoading, isError }: Props) {
  const by = summary?.byStatus
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Total paket"
        value={summary?.total ?? 0}
        hint="paket layanan"
        icon={PackageIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Aktif"
        value={by?.active ?? 0}
        hint="dijual"
        icon={CheckCircle2Icon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Arsip"
        value={by?.archived ?? 0}
        hint="tidak dijual"
        icon={ArchiveIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Total pelanggan"
        value={summary?.totalSubscribers ?? 0}
        hint="berlangganan paket"
        icon={UsersIcon}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  )
}

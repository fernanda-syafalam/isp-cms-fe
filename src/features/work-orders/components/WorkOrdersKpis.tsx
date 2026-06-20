import { CalendarClockIcon, CheckCircle2Icon, ClipboardListIcon, ClockIcon } from 'lucide-react'

import { KpiCard } from '@/components/shared/kpi-card'
import type { WorkOrderSummary } from '@/schemas/workorder'

type Props = {
  summary: WorkOrderSummary | undefined
  isLoading: boolean
  isError: boolean
}

// Full-set KPI row for work orders (total / scheduled / in-progress / done).
export function WorkOrdersKpis({ summary, isLoading, isError }: Props) {
  const by = summary?.byStatus
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Total work order"
        value={summary?.total ?? 0}
        hint="seluruh WO"
        icon={ClipboardListIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Terjadwal"
        value={by?.scheduled ?? 0}
        hint="menunggu kunjungan"
        icon={CalendarClockIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Dalam proses"
        value={by?.in_progress ?? 0}
        hint="sedang dikerjakan"
        accent="amber"
        icon={ClockIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Selesai"
        value={by?.done ?? 0}
        hint="WO tuntas"
        icon={CheckCircle2Icon}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  )
}

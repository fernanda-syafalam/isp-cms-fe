import { ClockIcon, InboxIcon, LifeBuoyIcon, TriangleAlertIcon } from 'lucide-react'

import { KpiCard } from '@/components/shared/kpi-card'
import type { TicketSummary } from '@/schemas/ticket'

type Props = {
  summary: TicketSummary | undefined
  isLoading: boolean
  isError: boolean
}

// Full-set KPI row for the ticket queue (total / open / in-progress / breached).
export function TicketsKpis({ summary, isLoading, isError }: Props) {
  const by = summary?.byStatus
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Total tiket"
        value={summary?.total ?? 0}
        hint="seluruh tiket"
        icon={LifeBuoyIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Terbuka"
        value={by?.open ?? 0}
        hint="menunggu penanganan"
        icon={InboxIcon}
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
        label="SLA terlampaui"
        value={by?.breached ?? 0}
        hint="lewat batas SLA"
        hintTone="negative"
        icon={TriangleAlertIcon}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  )
}

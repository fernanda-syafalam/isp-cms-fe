import { ReceiptTextIcon, TriangleAlertIcon, WalletIcon } from 'lucide-react'

import { KpiCard } from '@/components/shared/kpi-card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatNumber } from '@/lib/format'
import type { InvoiceSummary } from '@/schemas/invoice'

// AR summary cards (outstanding / overdue / total). The summary is a full-set
// server aggregate; show skeletons until it arrives.
export function InvoicesKpis({ summary }: { summary: InvoiceSummary | undefined }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {!summary ? (
        <>
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </>
      ) : (
        <>
          <KpiCard
            label="Total piutang (AR)"
            value={summary.outstanding}
            format={formatCurrency}
            hint={`${formatNumber(summary.unpaidCount)} tagihan belum bayar`}
            accent="amber"
            icon={WalletIcon}
          />
          <KpiCard
            label="Terlambat"
            value={summary.overdue}
            format={formatCurrency}
            hint="jatuh tempo terlewat"
            hintTone="negative"
            icon={TriangleAlertIcon}
          />
          <KpiCard
            label="Total tagihan"
            value={summary.total}
            hint="periode berjalan"
            icon={ReceiptTextIcon}
          />
        </>
      )}
    </div>
  )
}

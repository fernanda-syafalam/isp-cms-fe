import { CheckCircle2Icon, TicketIcon, WalletIcon } from 'lucide-react'

import { KpiCard } from '@/components/shared/kpi-card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/format'
import type { VoucherSummary } from '@/schemas/voucher'

// Full-set KPI row for vouchers (total / unused / used / revenue). The summary
// is a full-set server aggregate; show skeletons until it arrives.
export function VouchersKpis({ summary }: { summary: VoucherSummary | undefined }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {!summary ? (
        <>
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </>
      ) : (
        <>
          <KpiCard
            label="Total voucher"
            value={summary.total}
            hint="seluruh batch"
            icon={TicketIcon}
          />
          <KpiCard
            label="Belum dipakai"
            value={summary.unused}
            hint="siap dijual"
            accent="amber"
            icon={TicketIcon}
          />
          <KpiCard
            label="Terpakai"
            value={summary.used}
            hint="sudah ditukar"
            hintTone="positive"
            icon={CheckCircle2Icon}
          />
          <KpiCard
            label="Pendapatan voucher"
            value={summary.revenue}
            format={formatCurrency}
            hint="dari voucher terpakai"
            icon={WalletIcon}
          />
        </>
      )}
    </div>
  )
}

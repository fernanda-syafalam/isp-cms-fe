import { LandmarkIcon, QrCodeIcon, ReceiptTextIcon, WalletIcon } from 'lucide-react'

import { KpiCard } from '@/components/shared/kpi-card'
import { formatCurrency } from '@/lib/format'
import type { PaymentSummary } from '@/schemas/payment'

type Props = {
  summary: PaymentSummary | undefined
  isLoading: boolean
  isError: boolean
}

// Full-set KPI row for payments (total amount / count / QRIS / VA).
export function PaymentsKpis({ summary, isLoading, isError }: Props) {
  const by = summary?.byMethod
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Total diterima"
        value={formatCurrency(summary?.totalAmount ?? 0)}
        hint="seluruh pembayaran"
        icon={WalletIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Transaksi"
        value={summary?.total ?? 0}
        hint="jumlah pembayaran"
        icon={ReceiptTextIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="QRIS"
        value={by?.qris ?? 0}
        hint="via QRIS"
        icon={QrCodeIcon}
        isLoading={isLoading}
        isError={isError}
      />
      <KpiCard
        label="Virtual Account"
        value={by?.va ?? 0}
        hint="via VA"
        icon={LandmarkIcon}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  )
}

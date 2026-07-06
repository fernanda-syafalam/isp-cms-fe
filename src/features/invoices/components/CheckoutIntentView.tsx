import { CreditCardIcon, QrCodeIcon } from 'lucide-react'

import { formatCurrency, formatDateTime } from '@/lib/format'
import type { PaymentIntent } from '@/schemas/payment'

type Props = {
  intent: PaymentIntent
}

// The VA-number / QRIS payload view shown once an intent exists. Shared by the
// fresh-checkout and resume-pending flows so both render an identical charge.
export function CheckoutIntentView({ intent }: Props) {
  return (
    <div className="space-y-4">
      {intent.qrPayload ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/30 p-6">
          <QrCodeIcon className="size-24 text-foreground" />
          <p className="font-mono text-muted-foreground text-xs">{intent.qrPayload}</p>
          <p className="text-muted-foreground text-xs">Scan QRIS dengan aplikasi apa pun</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="flex items-center gap-2 text-muted-foreground text-xs">
            <CreditCardIcon className="size-4" /> Nomor Virtual Account
          </p>
          <p className="mt-1 font-mono font-semibold text-lg tracking-wider">{intent.vaNumber}</p>
        </div>
      )}
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Jumlah</dt>
          <dd className="font-mono tabular-nums">{formatCurrency(intent.amount)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Kedaluwarsa</dt>
          <dd>{formatDateTime(intent.expiresAt)}</dd>
        </div>
      </dl>
      <p className="text-muted-foreground text-xs">
        Di produksi, gateway akan mengirim webhook saat pembayaran masuk. Untuk demo, tekan tombol
        di bawah untuk mensimulasikan pembayaran berhasil.
      </p>
    </div>
  )
}

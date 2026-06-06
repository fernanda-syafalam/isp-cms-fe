import { CreditCardIcon, QrCodeIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { invoiceTotal } from '@/lib/invoice'
import type { Invoice } from '@/schemas/invoice'
import type { PaymentChannel, PaymentIntent } from '@/schemas/payment'

import { useConfirmPaymentIntent, useCreatePaymentIntent } from '../hooks/useCheckout'

const CHANNELS: Array<{ value: PaymentChannel; label: string }> = [
  { value: 'qris', label: 'QRIS' },
  { value: 'va_bca', label: 'Virtual Account BCA' },
  { value: 'va_mandiri', label: 'Virtual Account Mandiri' },
  { value: 'va_bri', label: 'Virtual Account BRI' },
  { value: 'va_bni', label: 'Virtual Account BNI' },
  { value: 'gopay', label: 'GoPay' },
  { value: 'ovo', label: 'OVO' },
  { value: 'dana', label: 'DANA' },
  { value: 'shopeepay', label: 'ShopeePay' },
]

type Props = {
  invoice: Invoice
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CheckoutDialog({ invoice, open, onOpenChange }: Props) {
  const [channel, setChannel] = useState<PaymentChannel>('qris')
  const [intent, setIntent] = useState<PaymentIntent | null>(null)
  const create = useCreatePaymentIntent()
  const confirm = useConfirmPaymentIntent()

  const reset = () => {
    setIntent(null)
    setChannel('qris')
  }

  const handleCreate = async () => {
    try {
      const result = await create.mutateAsync({
        invoiceId: invoice.id,
        channel,
      })
      setIntent(result)
    } catch {
      // useCreatePaymentIntent surfaces a toast.
    }
  }

  const handleConfirm = async () => {
    if (!intent) return
    try {
      await confirm.mutateAsync(intent.id)
      reset()
      onOpenChange(false)
    } catch {
      // useConfirmPaymentIntent surfaces a toast.
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bayar online</DialogTitle>
          <DialogDescription>
            {invoice.invoiceNo} · {formatCurrency(invoiceTotal(invoice))}
          </DialogDescription>
        </DialogHeader>

        {!intent ? (
          <div className="space-y-2">
            <Select value={channel} onValueChange={(v) => setChannel(v as PaymentChannel)}>
              <SelectTrigger className="w-full" aria-label="Metode pembayaran">
                <SelectValue placeholder="Pilih metode" />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
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
                <p className="mt-1 font-mono font-semibold text-lg tracking-wider">
                  {intent.vaNumber}
                </p>
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
              Di produksi, gateway akan mengirim webhook saat pembayaran masuk. Untuk demo, tekan
              tombol di bawah untuk mensimulasikan pembayaran berhasil.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={create.isPending || confirm.isPending}
          >
            Batal
          </Button>
          {!intent ? (
            <Button onClick={handleCreate} disabled={create.isPending}>
              {create.isPending ? 'Memproses…' : 'Lanjut bayar'}
            </Button>
          ) : (
            <Button onClick={handleConfirm} disabled={confirm.isPending}>
              {confirm.isPending ? 'Memproses…' : 'Simulasikan pembayaran berhasil'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

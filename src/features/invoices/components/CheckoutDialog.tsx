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
import { formatCurrency } from '@/lib/format'
import { invoiceTotal } from '@/lib/invoice'
import type { Invoice } from '@/schemas/invoice'
import type { PaymentChannel, PaymentIntent } from '@/schemas/payment'

import {
  type CheckoutScope,
  useConfirmPaymentIntent,
  useCreatePaymentIntent,
} from '../hooks/useCheckout'
import { CheckoutIntentView } from './CheckoutIntentView'

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
  // Which gateway route to use — portal customers must not hit the staff route.
  scope?: CheckoutScope
  // A still-pending intent to resume instead of picking a channel (P3.C.3).
  existingIntent?: PaymentIntent | undefined
}

export function CheckoutDialog({
  invoice,
  open,
  onOpenChange,
  scope = 'staff',
  existingIntent,
}: Props) {
  const isResume = existingIntent != null
  const [channel, setChannel] = useState<PaymentChannel>('qris')
  const [intent, setIntent] = useState<PaymentIntent | null>(existingIntent ?? null)
  const create = useCreatePaymentIntent(scope)
  const confirm = useConfirmPaymentIntent(scope)

  // Resuming keeps the seeded intent on close (no discard); a fresh flow clears.
  const reset = () => {
    setIntent(existingIntent ?? null)
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

        {isResume ? (
          <p
            className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-700 text-sm dark:text-amber-400"
            role="status"
          >
            Lanjutkan pembayaran yang tertunda — selesaikan sebelum kedaluwarsa.
          </p>
        ) : null}

        {intent ? (
          <CheckoutIntentView intent={intent} />
        ) : (
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
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={create.isPending || confirm.isPending}
          >
            {isResume ? 'Tutup' : 'Batal'}
          </Button>
          {intent ? (
            <Button onClick={handleConfirm} disabled={confirm.isPending}>
              {confirm.isPending ? 'Memproses…' : 'Simulasikan pembayaran berhasil'}
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={create.isPending}>
              {create.isPending ? 'Memproses…' : 'Lanjut bayar'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

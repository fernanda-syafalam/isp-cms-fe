import { Loader2Icon } from 'lucide-react'
import { useCallback, useState } from 'react'

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
  usePollPortalPayIntent,
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

// The customer can no longer self-settle (SEC-H1); once the charge exists the
// portal only watches it. This footnote replaces the staff "simulate" hint.
function PortalWaitingFooter({ isTimedOut }: { isTimedOut: boolean }) {
  if (isTimedOut) {
    return (
      <p className="text-muted-foreground text-xs" role="status">
        Kami belum menerima konfirmasi pembayaran. Tutup jendela ini dan periksa kembali status
        tagihan Anda nanti.
      </p>
    )
  }
  return (
    <p className="flex items-center gap-2 text-muted-foreground text-xs" role="status">
      <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
      Menunggu konfirmasi pembayaran… Selesaikan pembayaran melalui QRIS/VA di atas; layanan aktif
      otomatis setelah pembayaran terkonfirmasi.
    </p>
  )
}

export function CheckoutDialog({
  invoice,
  open,
  onOpenChange,
  scope = 'staff',
  existingIntent,
}: Props) {
  const isPortal = scope === 'portal'
  const isResume = existingIntent != null
  const [channel, setChannel] = useState<PaymentChannel>('qris')
  const [intent, setIntent] = useState<PaymentIntent | null>(existingIntent ?? null)
  const create = useCreatePaymentIntent(scope)
  // Staff/loket only — the portal never confirms, it polls (SEC-H1).
  const confirm = useConfirmPaymentIntent()

  // Resuming keeps the seeded intent on close (no discard); a fresh flow clears.
  const reset = useCallback(() => {
    setIntent(existingIntent ?? null)
    setChannel('qris')
  }, [existingIntent])

  const closeAndReset = useCallback(() => {
    reset()
    onOpenChange(false)
  }, [reset, onOpenChange])

  // Portal watches its own intent until settlement/expiry drives the close.
  const poll = usePollPortalPayIntent(isPortal ? (intent?.id ?? null) : null, {
    enabled: isPortal && open && intent != null,
    onPaid: closeAndReset,
    onExpired: closeAndReset,
  })

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
      closeAndReset()
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
          <CheckoutIntentView
            intent={intent}
            footer={isPortal ? <PortalWaitingFooter isTimedOut={poll.isTimedOut} /> : undefined}
          />
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
            // Staff/loket simulate settlement; the portal only polls (no button).
            isPortal ? null : (
              <Button onClick={handleConfirm} disabled={confirm.isPending}>
                {confirm.isPending ? 'Memproses…' : 'Simulasikan pembayaran berhasil'}
              </Button>
            )
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

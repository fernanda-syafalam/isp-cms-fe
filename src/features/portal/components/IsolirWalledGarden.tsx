import { AlertTriangleIcon, CreditCardIcon, LifeBuoyIcon, WifiOffIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckoutDialog } from '@/features/invoices'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Customer } from '@/schemas/customer'
import type { Invoice } from '@/schemas/invoice'

import { PortalInvoiceRow } from './PortalInvoiceList'

type Props = {
  customer: Customer
  invoices: Invoice[]
  outstanding: number
  oldestUnpaid: Invoice | undefined
}

// Full-screen "walled garden" shown while a subscriber is isolir. It replaces
// the normal portal dashboard so the only thing on screen is why service is
// blocked and how to restore it. Punitive (overdue) isolation gets a working
// pay-to-reactivate CTA; a voluntary hold (cuti) is non-punitive — it points to
// support instead, never framing it as pay-to-unblock (see P3.A.3).
export function IsolirWalledGarden({ customer, invoices, outstanding, oldestUnpaid }: Props) {
  const [payOpen, setPayOpen] = useState(false)
  const unpaid = invoices.filter((i) => i.status === 'pending' || i.status === 'overdue')

  if (customer.holdReason === 'voluntary') {
    return (
      <section className="mx-auto flex min-h-[80vh] max-w-lg flex-col items-center justify-center gap-6 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <WifiOffIcon className="size-8" aria-hidden="true" />
        </span>
        <div role="alert" aria-live="polite" className="space-y-2">
          <h1 className="font-semibold text-2xl text-foreground">
            Layanan dijeda atas permintaan Anda
          </h1>
          <p className="text-muted-foreground">
            Layanan internet Anda sedang dijeda sementara (cuti) sesuai permintaan Anda. Tidak ada
            tagihan yang perlu dibayar untuk mengaktifkannya kembali.
          </p>
        </div>
        <Card className="w-full text-left">
          <CardContent className="flex items-start gap-3 py-5">
            <LifeBuoyIcon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">Ingin mengaktifkan kembali?</p>
              <p className="text-muted-foreground">
                Hubungi tim dukungan kami dan sebutkan nomor pelanggan{' '}
                <span className="font-mono text-foreground">{customer.customerNo}</span> untuk
                melanjutkan layanan Anda.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    )
  }

  // Punitive isolation (holdReason === 'overdue' or unset) — pay to reactivate.
  return (
    <section className="mx-auto flex min-h-[80vh] max-w-lg flex-col items-center justify-center gap-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangleIcon className="size-8" aria-hidden="true" />
        </span>
        <div role="alert" aria-live="assertive" className="space-y-2">
          <h1 className="font-semibold text-2xl text-foreground">
            Layanan Anda diisolir karena tagihan belum dibayar
          </h1>
          <p className="text-muted-foreground">
            Selesaikan pembayaran untuk mengaktifkan kembali layanan secara otomatis.
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">Total tagihan belum dibayar</p>
          <p className="font-bold font-mono text-4xl text-foreground tabular-nums">
            {formatCurrency(outstanding)}
          </p>
          {oldestUnpaid ? (
            <p className="text-muted-foreground text-sm">
              Jatuh tempo paling awal {formatDate(oldestUnpaid.dueDate)}
            </p>
          ) : null}
        </div>
        {oldestUnpaid ? (
          <>
            <Button size="lg" onClick={() => setPayOpen(true)}>
              <CreditCardIcon className="size-4" />
              Bayar sekarang
            </Button>
            <CheckoutDialog invoice={oldestUnpaid} open={payOpen} onOpenChange={setPayOpen} />
          </>
        ) : null}
      </div>

      {unpaid.length > 0 ? (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-base">Tagihan belum dibayar</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {unpaid.map((inv) => (
                <PortalInvoiceRow key={inv.id} invoice={inv} />
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </section>
  )
}

import { Link } from '@tanstack/react-router'
import { BellRingIcon, CreditCardIcon, PrinterIcon, WalletIcon } from 'lucide-react'
import { useState } from 'react'

import { DetailActionBar } from '@/components/shared/detail-sheet'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCan } from '@/features/auth'
import { statusLabel } from '@/lib/status-label'
import type { Invoice } from '@/schemas/invoice'
import { PaymentMethodSchema } from '@/schemas/payment'

import { useRemindOverdue } from '../hooks/useBilling'
import { usePayInvoice } from '../hooks/useInvoices'
import { CheckoutDialog } from './CheckoutDialog'

// Action bar for the invoice quick-view drawer: online checkout, manual payment
// recording, overdue reminder (gated), and print/receipt.
export function InvoiceSheetActions({ invoice }: { invoice: Invoice }) {
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const canRemind = useCan('billing.run')
  const remind = useRemindOverdue()
  const pay = usePayInvoice(invoice.id)
  const unpaid = invoice.status !== 'paid'

  return (
    <DetailActionBar>
      {unpaid ? (
        <>
          <Button size="sm" onClick={() => setCheckoutOpen(true)}>
            <CreditCardIcon className="size-4" />
            Bayar online
          </Button>
          <CheckoutDialog invoice={invoice} open={checkoutOpen} onOpenChange={setCheckoutOpen} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={pay.isPending}>
                <WalletIcon className="size-4" />
                Catat manual
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Metode</DropdownMenuLabel>
              {PaymentMethodSchema.options.map((method) => (
                <DropdownMenuItem key={method} onSelect={() => pay.mutate({ method })}>
                  {statusLabel(method)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {canRemind ? (
            <Button
              variant="outline"
              size="sm"
              disabled={remind.isPending}
              onClick={() => remind.mutate([invoice.id])}
            >
              <BellRingIcon className="size-4" />
              Ingatkan
            </Button>
          ) : null}
        </>
      ) : null}
      <Button asChild variant="outline" size="sm">
        <Link to="/invoices/print/$invoiceId" params={{ invoiceId: invoice.id }}>
          <PrinterIcon className="size-4" />
          {invoice.status === 'paid' ? 'Kwitansi' : 'Cetak'}
        </Link>
      </Button>
    </DetailActionBar>
  )
}

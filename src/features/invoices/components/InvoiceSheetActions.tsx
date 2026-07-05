import { Link } from '@tanstack/react-router'
import { BellRingIcon, CreditCardIcon, PrinterIcon, WalletIcon } from 'lucide-react'
import { useState } from 'react'

import { DetailActionBar } from '@/components/shared/detail-sheet'
import { Button } from '@/components/ui/button'
import { useCan } from '@/features/auth'
import type { Invoice } from '@/schemas/invoice'

import { useRemindOverdue } from '../hooks/useBilling'
import { CheckoutDialog } from './CheckoutDialog'
import { LoketPayDialog } from './LoketPayDialog'

// Action bar for the invoice quick-view drawer: online checkout, manual payment
// recording (loket, supports partial + cash change), overdue reminder (gated),
// and print/receipt.
export function InvoiceSheetActions({ invoice }: { invoice: Invoice }) {
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [loketOpen, setLoketOpen] = useState(false)
  const canRemind = useCan('billing.run')
  const remind = useRemindOverdue()
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
          <Button variant="outline" size="sm" onClick={() => setLoketOpen(true)}>
            <WalletIcon className="size-4" />
            Catat manual
          </Button>
          <LoketPayDialog invoice={invoice} open={loketOpen} onOpenChange={setLoketOpen} />
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

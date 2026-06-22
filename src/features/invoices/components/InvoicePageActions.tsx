import { BellRingIcon, CreditCardIcon, WalletIcon } from 'lucide-react'
import { useState } from 'react'

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

// Header action buttons for the full invoice page. Rendered individually so the
// page header can lay them out alongside copy/print; the sheet uses its own
// bundled action bar instead.

export function RemindButton({ invoice }: { invoice: Invoice }) {
  const canRemind = useCan('billing.run')
  const remind = useRemindOverdue()
  if (!canRemind) return null
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={remind.isPending}
      onClick={() => remind.mutate([invoice.id])}
    >
      <BellRingIcon className="size-4" />
      Kirim pengingat
    </Button>
  )
}

export function OnlinePayButton({ invoice }: { invoice: Invoice }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <CreditCardIcon className="size-4" />
        Bayar online
      </Button>
      <CheckoutDialog invoice={invoice} open={open} onOpenChange={setOpen} />
    </>
  )
}

export function PayMenu({ invoice }: { invoice: Invoice }) {
  const pay = usePayInvoice(invoice.id)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={pay.isPending}>
          <WalletIcon className="size-4" />
          Catat manual
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Metode</DropdownMenuLabel>
        {PaymentMethodSchema.options.map((method) => (
          <DropdownMenuItem key={method} onSelect={() => pay.mutate({ method })}>
            {statusLabel(method)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

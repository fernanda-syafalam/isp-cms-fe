import { BellRingIcon, CreditCardIcon, WalletIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useCan } from '@/features/auth'
import type { Invoice } from '@/schemas/invoice'

import { useRemindOverdue } from '../hooks/useBilling'
import { CheckoutDialog } from './CheckoutDialog'
import { LoketPayDialog } from './LoketPayDialog'

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
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <WalletIcon className="size-4" />
        Catat manual
      </Button>
      <LoketPayDialog invoice={invoice} open={open} onOpenChange={setOpen} />
    </>
  )
}

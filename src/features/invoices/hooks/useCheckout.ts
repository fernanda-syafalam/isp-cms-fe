import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { confirmPaymentIntent, createPaymentIntent } from '@/api/payments'
import { confirmPortalPayIntent, createPortalPayIntent } from '@/api/portal'
import { getErrorMessage } from '@/lib/errors'
import type { CreatePaymentIntentInput } from '@/schemas/payment'

// Which gateway route the checkout hits: staff uses /payments/intent, a portal
// customer uses the /portal/pay-intent route scoped to their own identity.
export type CheckoutScope = 'staff' | 'portal'

// Create a gateway charge (returns the pending intent with VA/QR).
export function useCreatePaymentIntent(scope: CheckoutScope = 'staff') {
  return useMutation({
    mutationFn: (input: CreatePaymentIntentInput) =>
      scope === 'portal' ? createPortalPayIntent(input) : createPaymentIntent(input),
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

// Simulate the gateway webhook confirming settlement → invoice becomes paid.
export function useConfirmPaymentIntent(scope: CheckoutScope = 'staff') {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      scope === 'portal' ? confirmPortalPayIntent(id) : confirmPaymentIntent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
      qc.invalidateQueries({ queryKey: ['audit'] })
      // Refresh the customer's self-service snapshot so the settled invoice and
      // the now-resolved pending intent drop off the portal immediately.
      qc.invalidateQueries({ queryKey: ['portal'] })
      toast.success('Pembayaran berhasil — tagihan lunas')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

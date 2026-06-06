import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { confirmPaymentIntent, createPaymentIntent } from '@/api/payments'
import { getErrorMessage } from '@/lib/errors'
import type { CreatePaymentIntentInput } from '@/schemas/payment'

// Create a gateway charge (returns the pending intent with VA/QR).
export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: (input: CreatePaymentIntentInput) => createPaymentIntent(input),
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

// Simulate the gateway webhook confirming settlement → invoice becomes paid.
export function useConfirmPaymentIntent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => confirmPaymentIntent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
      qc.invalidateQueries({ queryKey: ['audit'] })
      toast.success('Pembayaran berhasil — tagihan lunas')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

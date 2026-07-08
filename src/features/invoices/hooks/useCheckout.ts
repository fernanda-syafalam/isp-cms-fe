import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { confirmPaymentIntent, createPaymentIntent } from '@/api/payments'
import { createPortalPayIntent, getPortalPayIntent } from '@/api/portal'
import { analyticsKeys } from '@/features/analytics/queries/keys'
import { auditKeys } from '@/features/audit/queries/keys'
import { customerKeys } from '@/features/customers/queries/keys'
import { invoiceKeys } from '@/features/invoices/queries/keys'
import { paymentKeys } from '@/features/payments/queries/keys'
import { portalKeys } from '@/features/portal/queries/keys'
import { getErrorMessage } from '@/lib/errors'
import type { CreatePaymentIntentInput } from '@/schemas/payment'

// Which gateway route the checkout hits: staff uses /payments/intent, a portal
// customer uses the /portal/pay-intent route scoped to their own identity.
export type CheckoutScope = 'staff' | 'portal'

// How often the portal watches its own intent, and how long before it gives up.
// Deliberately gentle — this is a human staring at a QRIS/VA screen, not a hot
// loop. The interim SEC-H1 contract has no push channel yet (P4 webhook), so a
// short poll is the only way the customer sees settlement land.
const PORTAL_POLL_INTERVAL_MS = 3000
const PORTAL_POLL_TIMEOUT_MS = 120_000

// Invalidate everything a settled payment touches so the portal (and, in the
// staff app, the billing surfaces) reflect the paid invoice + reactivation.
function invalidateAfterSettlement(qc: ReturnType<typeof useQueryClient>): void {
  qc.invalidateQueries({ queryKey: invoiceKeys.all })
  qc.invalidateQueries({ queryKey: paymentKeys.all })
  qc.invalidateQueries({ queryKey: customerKeys.all })
  qc.invalidateQueries({ queryKey: analyticsKeys.all })
  qc.invalidateQueries({ queryKey: auditKeys.all })
  // Refresh the customer's self-service snapshot so the settled invoice and the
  // now-resolved pending intent drop off the portal immediately.
  qc.invalidateQueries({ queryKey: portalKeys.all })
}

// Create a gateway charge (returns the pending intent with VA/QR).
export function useCreatePaymentIntent(scope: CheckoutScope = 'staff') {
  return useMutation({
    mutationFn: (input: CreatePaymentIntentInput) =>
      scope === 'portal' ? createPortalPayIntent(input) : createPaymentIntent(input),
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

// Staff/loket settlement — simulate the gateway webhook confirming settlement.
// Customer-facing checkout no longer has this affordance: the customer can only
// poll their own intent (see usePollPortalPayIntent), never flip it (SEC-H1).
export function useConfirmPaymentIntent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => confirmPaymentIntent(id),
    onSuccess: () => {
      invalidateAfterSettlement(qc)
      toast.success('Pembayaran berhasil — tagihan lunas')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

type PortalPollOptions = {
  // Only poll while the dialog is open and an intent exists.
  enabled: boolean
  // Called once when the intent settles (`paid`) so the caller can close.
  onPaid: () => void
  // Called once when the intent lapses (`expired`) so the caller can close.
  onExpired: () => void
}

type PortalPollResult = {
  // The latest intent status seen by the poll, if any.
  status: 'pending' | 'paid' | 'expired' | undefined
  // Whether the poll is still actively watching (not settled/expired/timed out).
  isPolling: boolean
  // True once the client-side timeout elapsed without a settlement.
  isTimedOut: boolean
}

// Poll the customer's own pay-intent until it settles or expires (SEC-H1). The
// customer can no longer confirm their own charge, so the portal watches the
// read-only status endpoint and reacts to the transition the gateway (mock:
// MSW; prod: P4 webhook) drives. Side effects (toast + invalidate + close) fire
// exactly once per transition.
export function usePollPortalPayIntent(
  intentId: string | null,
  { enabled, onPaid, onExpired }: PortalPollOptions,
): PortalPollResult {
  const qc = useQueryClient()
  const startedAtRef = useRef<number | null>(null)
  const handledRef = useRef(false)

  const active = enabled && intentId != null

  const query = useQuery({
    queryKey: portalKeys.payIntent(intentId ?? ''),
    queryFn: () => getPortalPayIntent(intentId as string),
    enabled: active,
    gcTime: 0,
    refetchInterval: (q) => {
      const status = q.state.data?.status
      if (status === 'paid' || status === 'expired') return false
      const startedAt = startedAtRef.current
      if (startedAt != null && Date.now() - startedAt > PORTAL_POLL_TIMEOUT_MS) return false
      return PORTAL_POLL_INTERVAL_MS
    },
  })

  const status = query.data?.status

  // Reset the poll bookkeeping whenever it (re)starts so a reused dialog polls
  // afresh instead of inheriting a prior run's "already handled" flag.
  useEffect(() => {
    if (active) {
      startedAtRef.current = Date.now()
      handledRef.current = false
    } else {
      startedAtRef.current = null
    }
  }, [active])

  // React to the settle/expire transition exactly once.
  useEffect(() => {
    if (!active || handledRef.current) return
    if (status === 'paid') {
      handledRef.current = true
      invalidateAfterSettlement(qc)
      toast.success('Pembayaran berhasil — tagihan lunas')
      onPaid()
    } else if (status === 'expired') {
      handledRef.current = true
      toast.error('Pembayaran kedaluwarsa — silakan mulai pembayaran baru')
      onExpired()
    }
  }, [active, status, qc, onPaid, onExpired])

  const isSettled = status === 'paid' || status === 'expired'
  const isTimedOut =
    active &&
    !isSettled &&
    startedAtRef.current != null &&
    Date.now() - startedAtRef.current > PORTAL_POLL_TIMEOUT_MS

  return {
    status,
    isPolling: active && !isSettled && !isTimedOut,
    isTimedOut: Boolean(isTimedOut),
  }
}

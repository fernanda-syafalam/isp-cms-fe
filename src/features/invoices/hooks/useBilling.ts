import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  getSchedulerPreview,
  isolirOverdue,
  remindOverdue,
  runBilling,
  runScheduler,
} from '@/api/billing'
import { analyticsKeys } from '@/features/analytics/queries/keys'
import { auditKeys } from '@/features/audit/queries/keys'
import { customerKeys } from '@/features/customers/queries/keys'
import { billingKeys, invoiceKeys } from '@/features/invoices/queries/keys'
import { notificationKeys } from '@/features/notifications/queries/keys'
import { paymentKeys } from '@/features/payments/queries/keys'
import { topologyKeys } from '@/features/topology/queries/keys'
import { getErrorMessage } from '@/lib/errors'

function useInvalidateBilling() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: invoiceKeys.all })
    qc.invalidateQueries({ queryKey: customerKeys.all })
    qc.invalidateQueries({ queryKey: paymentKeys.all })
    qc.invalidateQueries({ queryKey: analyticsKeys.all })
    // Mass isolir flips topology nodes to "down" — refresh the map too.
    qc.invalidateQueries({ queryKey: topologyKeys.all })
    // Reminders write to the WhatsApp notification log.
    qc.invalidateQueries({ queryKey: notificationKeys.all })
  }
}

export function useRunBilling() {
  const invalidate = useInvalidateBilling()
  return useMutation({
    mutationFn: runBilling,
    onSuccess: (res) => {
      invalidate()
      toast.success(
        res.created > 0
          ? `Billing ${res.period}: ${res.created} tagihan dibuat`
          : `Billing ${res.period}: semua pelanggan sudah ditagih`,
      )
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useIsolirOverdue() {
  const invalidate = useInvalidateBilling()
  return useMutation({
    mutationFn: isolirOverdue,
    onSuccess: (res) => {
      invalidate()
      toast.success(
        res.isolated > 0
          ? `${res.isolated} pelanggan diisolir (${res.markedOverdue} tagihan jatuh tempo)`
          : 'Tidak ada penunggak untuk diisolir',
      )
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

// Automation: preview what the next cycle would do (open it on a dialog).
export function useSchedulerPreview(enabled = true) {
  return useQuery({
    queryKey: billingKeys.schedulerPreview(),
    queryFn: getSchedulerPreview,
    enabled,
    staleTime: 0,
  })
}

// Run the full automated cycle: bill → mark overdue → remind → isolir.
export function useRunScheduler() {
  const invalidate = useInvalidateBilling()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: runScheduler,
    onSuccess: (res) => {
      invalidate()
      qc.invalidateQueries({ queryKey: billingKeys.scheduler() })
      qc.invalidateQueries({ queryKey: auditKeys.all })
      toast.success(
        `Siklus ${res.period}: ${res.created} tagihan, ${res.remindedUpcoming + res.remindedOverdue} pengingat, ${res.isolated} isolir`,
      )
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

// Dunning: send payment reminders. Pass invoiceIds for a selection, or omit to
// remind every overdue invoice (all penunggak).
export function useRemindOverdue() {
  const invalidate = useInvalidateBilling()
  return useMutation({
    mutationFn: (invoiceIds?: string[]) => remindOverdue(invoiceIds),
    onSuccess: (res) => {
      invalidate()
      toast.success(
        res.reminded > 0
          ? `${res.reminded} pengingat terkirim via WhatsApp`
          : 'Tidak ada tagihan untuk diingatkan',
      )
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

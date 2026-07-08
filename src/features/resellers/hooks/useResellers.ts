import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { listCustomers } from '@/api/customers'
import {
  type LedgerFilter,
  RESELLER_EXPORT_LIMIT,
  type ResellerFilter,
  addLedgerEntry,
  approvePayout,
  createPayout,
  createReseller,
  disbursePayout,
  getReseller,
  listPayouts,
  listResellerLedger,
  listResellers,
  rejectPayout,
  updateReseller,
} from '@/api/resellers'
import { customerKeys } from '@/features/customers/queries/keys'
import { getErrorMessage } from '@/lib/errors'
import type {
  AddLedgerEntryInput,
  CreatePayoutInput,
  CreateResellerInput,
  UpdateResellerInput,
} from '@/schemas/reseller'
import { resellerKeys } from '../queries/keys'

// `enabled` lets a caller skip the fetch when the current role isn't allowed to
// read the org-wide list (e.g. a mitra, who is redirected to their own
// storefront) — this avoids a 403 GET /v1/resellers on every session start.
export function useResellersList(filter: ResellerFilter = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: resellerKeys.list(filter),
    queryFn: () => listResellers(filter),
    enabled: options?.enabled ?? true,
  })
}

/**
 * Returns a callback that fetches the full filtered reseller set (one max-size
 * page) for CSV export. With server pagination the table holds only the current
 * page, so export must re-query without the page window.
 */
export function useExportResellers() {
  const qc = useQueryClient()
  return (filter: ResellerFilter = {}) => {
    const exportFilter: ResellerFilter = {
      ...filter,
      limit: RESELLER_EXPORT_LIMIT,
      offset: 0,
    }
    return qc.fetchQuery({
      queryKey: resellerKeys.list(exportFilter),
      queryFn: () => listResellers(exportFilter),
    })
  }
}

// Customers registered by a reseller. The server narrows the list by
// `resellerId` (BE #118), so the FE no longer pulls the full customer base and
// filters it in the browser.
export function useResellerCustomers(resellerId: string) {
  return useQuery({
    queryKey: customerKeys.list({ resellerId }),
    queryFn: () => listCustomers({ resellerId }),
    select: (data) => data.items,
  })
}

// A single customer scoped to one reseller (P3.D.5). Reuses the server-side
// reseller-scoped list, then finds the id within it — so an id that is NOT one
// of this reseller's own customers resolves to `undefined`. That enforces the
// mitra scope on the FE (the scoped detail page renders not-found for it)
// without widening the mitra surface to the org-wide `/customers` list.
export function useResellerCustomer(resellerId: string, customerId: string) {
  return useQuery({
    queryKey: customerKeys.list({ resellerId }),
    queryFn: () => listCustomers({ resellerId }),
    select: (data) => data.items.find((c) => c.id === customerId),
  })
}

export function useReseller(id: string) {
  return useQuery({
    queryKey: resellerKeys.detail(id),
    queryFn: () => getReseller(id),
  })
}

export function useResellerLedger(id: string, filter: LedgerFilter = {}) {
  return useQuery({
    queryKey: resellerKeys.ledger(id, filter),
    queryFn: () => listResellerLedger(id, filter),
  })
}

const LEDGER_TYPE_TOAST: Record<AddLedgerEntryInput['type'], string> = {
  topup: 'Top-up deposit dicatat',
  commission: 'Komisi dicatat',
  deduction: 'Potongan dicatat',
  withdrawal: 'Penarikan dicatat',
}

export function useAddLedgerEntry(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AddLedgerEntryInput) => addLedgerEntry(id, input),
    onSuccess: (reseller, vars) => {
      qc.setQueryData(resellerKeys.detail(id), reseller)
      qc.invalidateQueries({ queryKey: resellerKeys.ledgerBase(id) })
      qc.invalidateQueries({ queryKey: resellerKeys.lists() })
      toast.success(LEDGER_TYPE_TOAST[vars.type])
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useCreateReseller() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateResellerInput) => createReseller(input),
    onSuccess: (reseller) => {
      qc.invalidateQueries({ queryKey: resellerKeys.lists() })
      toast.success(`Reseller "${reseller.name}" ditambahkan`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

// Payouts (P3.D.4). Query key is a sub-resource of the reseller detail.
export function usePayouts(resellerId: string) {
  return useQuery({
    queryKey: resellerKeys.payouts(resellerId),
    queryFn: () => listPayouts(resellerId),
  })
}

// Shared cache invalidation for any payout write. `disburse` also moves the
// balance + ledger, so we refresh the detail, its ledger, the payouts list, and
// the org-wide reseller list (balance column).
function invalidatePayoutCaches(qc: ReturnType<typeof useQueryClient>, resellerId: string) {
  qc.invalidateQueries({ queryKey: resellerKeys.detail(resellerId) })
  qc.invalidateQueries({
    queryKey: resellerKeys.ledgerBase(resellerId),
  })
  qc.invalidateQueries({
    queryKey: resellerKeys.payouts(resellerId),
  })
  qc.invalidateQueries({ queryKey: resellerKeys.lists() })
}

export function useCreatePayout(resellerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePayoutInput) => createPayout(resellerId, input),
    onSuccess: () => {
      invalidatePayoutCaches(qc, resellerId)
      toast.success('Permintaan pencairan diajukan')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useApprovePayout(resellerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payoutId: string) => approvePayout(resellerId, payoutId),
    onSuccess: () => {
      invalidatePayoutCaches(qc, resellerId)
      toast.success('Pencairan disetujui')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useRejectPayout(resellerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payoutId: string) => rejectPayout(resellerId, payoutId),
    onSuccess: () => {
      invalidatePayoutCaches(qc, resellerId)
      toast.success('Pencairan ditolak')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useDisbursePayout(resellerId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payoutId: string) => disbursePayout(resellerId, payoutId),
    onSuccess: () => {
      invalidatePayoutCaches(qc, resellerId)
      toast.success('Pencairan dicairkan')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateReseller(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateResellerInput) => updateReseller(id, input),
    onSuccess: (reseller) => {
      qc.invalidateQueries({ queryKey: resellerKeys.all })
      toast.success(
        reseller.status === 'inactive'
          ? `Reseller "${reseller.name}" dinonaktifkan`
          : `Reseller "${reseller.name}" diperbarui`,
      )
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

// Real commission earned (P3.D.1): sum of the reseller's `commission` ledger
// entries, replacing the old hardcoded-ARPU estimate. Pulls one max-size
// ledger page (the ledger is small per reseller) and sums client-side.
const COMMISSION_LEDGER_LIMIT = 200

export function useResellerCommissionTotal(id: string) {
  return useQuery({
    queryKey: resellerKeys.commissionTotal(id),
    queryFn: async () => {
      const ledger = await listResellerLedger(id, {
        limit: COMMISSION_LEDGER_LIMIT,
        offset: 0,
      })
      return ledger.items
        .filter((e) => e.type === 'commission')
        .reduce((sum, e) => sum + e.amount, 0)
    },
  })
}

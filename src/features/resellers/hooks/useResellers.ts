import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { listCustomers } from '@/api/customers'
import {
  addLedgerEntry,
  getReseller,
  listResellerLedger,
  listResellers,
  updateReseller,
} from '@/api/resellers'
import { getErrorMessage } from '@/lib/errors'
import type { AddLedgerEntryInput, UpdateResellerInput } from '@/schemas/reseller'

export function useResellersList() {
  return useQuery({
    queryKey: ['resellers', 'list'] as const,
    queryFn: listResellers,
  })
}

// Customers registered by a reseller — joins the customer base by resellerName.
export function useResellerCustomers(resellerName: string) {
  return useQuery({
    queryKey: ['customers', 'list', { reseller: resellerName }] as const,
    queryFn: () => listCustomers({}),
    select: (data) => data.items.filter((c) => c.resellerName === resellerName),
  })
}

export function useReseller(id: string) {
  return useQuery({
    queryKey: ['resellers', 'detail', id] as const,
    queryFn: () => getReseller(id),
  })
}

export function useResellerLedger(id: string) {
  return useQuery({
    queryKey: ['resellers', 'detail', id, 'ledger'] as const,
    queryFn: () => listResellerLedger(id),
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
      qc.setQueryData(['resellers', 'detail', id], reseller)
      qc.invalidateQueries({ queryKey: ['resellers', 'detail', id, 'ledger'] })
      qc.invalidateQueries({ queryKey: ['resellers', 'list'] })
      toast.success(LEDGER_TYPE_TOAST[vars.type])
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateReseller(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateResellerInput) => updateReseller(id, input),
    onSuccess: (reseller) => {
      qc.invalidateQueries({ queryKey: ['resellers'] })
      toast.success(
        reseller.status === 'inactive'
          ? `Reseller "${reseller.name}" dinonaktifkan`
          : `Reseller "${reseller.name}" diperbarui`,
      )
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

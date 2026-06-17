import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  VOUCHER_EXPORT_LIMIT,
  type VoucherFilter,
  generateVoucherBatch,
  listVouchers,
  redeemVoucher,
} from '@/api/vouchers'
import { getErrorMessage } from '@/lib/errors'
import type { GenerateVoucherBatchInput, VoucherList } from '@/schemas/voucher'

export function useVouchersList(filter: VoucherFilter = {}) {
  return useQuery({
    queryKey: ['vouchers', 'list', filter] as const,
    queryFn: () => listVouchers(filter),
  })
}

// Export the full filtered set (server pagination keeps only the page in the
// table) by fetching a single max-size page through the query cache.
export function useExportVouchers() {
  const qc = useQueryClient()
  return (filter: VoucherFilter): Promise<VoucherList> => {
    const exportFilter: VoucherFilter = {
      ...filter,
      limit: VOUCHER_EXPORT_LIMIT,
      offset: 0,
    }
    return qc.fetchQuery({
      queryKey: ['vouchers', 'list', exportFilter] as const,
      queryFn: () => listVouchers(exportFilter),
    })
  }
}

export function useGenerateVoucherBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: GenerateVoucherBatchInput) => generateVoucherBatch(input),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['vouchers'] })
      toast.success(`${res.created} voucher dibuat (batch ${res.batchId})`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useRedeemVoucher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => redeemVoucher(id),
    onSuccess: (voucher) => {
      qc.invalidateQueries({ queryKey: ['vouchers'] })
      toast.success(`Voucher ${voucher.code} ditandai terpakai`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

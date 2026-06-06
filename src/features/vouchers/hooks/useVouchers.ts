import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  type VoucherFilter,
  generateVoucherBatch,
  listVouchers,
  redeemVoucher,
} from '@/api/vouchers'
import { getErrorMessage } from '@/lib/errors'
import type { GenerateVoucherBatchInput } from '@/schemas/voucher'

export function useVouchersList(filter: VoucherFilter = {}) {
  return useQuery({
    queryKey: ['vouchers', 'list', filter] as const,
    queryFn: () => listVouchers(filter),
  })
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

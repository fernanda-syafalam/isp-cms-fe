import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { createContract, getContract, sendContract, signContract } from '@/api/contracts'
import { getErrorMessage } from '@/lib/errors'
import { contractKeys } from '../queries/keys'

export function useContract(customerId: string) {
  return useQuery({
    queryKey: contractKeys.detail(customerId),
    queryFn: () => getContract(customerId),
  })
}

function useContractMutation(
  customerId: string,
  fn: (id: string) => Promise<unknown>,
  message: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => fn(customerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contractKeys.detail(customerId) })
      toast.success(message)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export const useCreateContract = (id: string) =>
  useContractMutation(id, createContract, 'Kontrak dibuat')
export const useSendContract = (id: string) =>
  useContractMutation(id, sendContract, 'Kontrak dikirim untuk tanda tangan')
export const useSignContract = (id: string) =>
  useContractMutation(id, signContract, 'Kontrak ditandatangani + e-Meterai')

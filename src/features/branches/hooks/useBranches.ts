import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { type BranchFilter, createBranch, listBranches, updateBranch } from '@/api/branches'
import { branchKeys } from '@/features/branches/queries/keys'
import { getErrorMessage } from '@/lib/errors'
import type { CreateBranchInput, UpdateBranchInput } from '@/schemas/branch'

export function useBranches(filter: BranchFilter = {}) {
  return useQuery({
    queryKey: branchKeys.list(filter),
    queryFn: () => listBranches(filter),
  })
}

export function useCreateBranch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateBranchInput) => createBranch(input),
    onSuccess: (b) => {
      qc.invalidateQueries({ queryKey: branchKeys.all })
      toast.success(`Cabang "${b.name}" ditambahkan`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateBranch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBranchInput }) =>
      updateBranch(id, input),
    onSuccess: (b) => {
      qc.invalidateQueries({ queryKey: branchKeys.all })
      toast.success(`Cabang "${b.name}" diperbarui`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

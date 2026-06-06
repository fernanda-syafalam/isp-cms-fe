import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { createBranch, listBranches } from '@/api/branches'
import { getErrorMessage } from '@/lib/errors'
import type { CreateBranchInput } from '@/schemas/branch'

export function useBranches() {
  return useQuery({
    queryKey: ['branches', 'list'] as const,
    queryFn: listBranches,
  })
}

export function useCreateBranch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateBranchInput) => createBranch(input),
    onSuccess: (b) => {
      qc.invalidateQueries({ queryKey: ['branches'] })
      toast.success(`Cabang "${b.name}" ditambahkan`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

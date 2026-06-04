import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { createUser, listUsers, type ListUsersParams } from '@/api/users'
import { getErrorMessage } from '@/lib/errors'
import type { CreateUserInput } from '@/schemas/user'

export function useUsersList(params: ListUsersParams = {}) {
  return useQuery({
    queryKey: ['users', 'list', params] as const,
    queryFn: () => listUsers(params),
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: (user) => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success(`User "${user.fullName}" created`)
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}

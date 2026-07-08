import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  createUser,
  deactivateUser,
  listUsers,
  resetUserPassword,
  updateUser,
  type ListUsersParams,
} from '@/api/users'
import { userKeys } from '@/features/users/queries/keys'
import { getErrorMessage } from '@/lib/errors'
import type { CreateUserInput, UpdateUserInput } from '@/schemas/user'

export function useUsersList(params: ListUsersParams = {}) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => listUsers(params),
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: (user) => {
      qc.invalidateQueries({ queryKey: userKeys.all })
      toast.success(`User "${user.fullName}" created`)
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) => updateUser(id, input),
    onSuccess: (user) => {
      qc.invalidateQueries({ queryKey: userKeys.all })
      toast.success(`Staf "${user.fullName}" diperbarui`)
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useResetUserPassword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => resetUserPassword(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all })
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useDeactivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deactivateUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all })
      toast.success('Akun dinonaktifkan')
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}

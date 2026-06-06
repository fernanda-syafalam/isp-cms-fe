import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  disableTwoFactor,
  enableTwoFactor,
  getSecurity,
  revokeOtherSessions,
  revokeSession,
} from '@/api/security'
import { getErrorMessage } from '@/lib/errors'

export function useSecurity() {
  return useQuery({
    queryKey: ['security'] as const,
    queryFn: getSecurity,
  })
}

export function useEnableTwoFactor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => enableTwoFactor(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['security'] })
      toast.success('Autentikasi dua faktor diaktifkan')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useDisableTwoFactor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => disableTwoFactor(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['security'] })
      toast.success('Autentikasi dua faktor dinonaktifkan')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useRevokeSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => revokeSession(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['security'] })
      toast.success('Sesi diakhiri')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useRevokeOtherSessions() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => revokeOtherSessions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['security'] })
      toast.success('Semua sesi lain diakhiri')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

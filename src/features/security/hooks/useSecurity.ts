import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  confirmTwoFactor,
  disableTwoFactor,
  enrollTwoFactor,
  getSecurity,
  revokeOtherSessions,
  revokeSession,
} from '@/api/security'
import { securityKeys } from '@/features/security/queries/keys'
import { getErrorMessage } from '@/lib/errors'

export function useSecurity() {
  return useQuery({
    queryKey: securityKeys.all,
    queryFn: getSecurity,
  })
}

// Step 1/2 — begin enrollment. The dialog reads the returned otpauth URI +
// secret to render the QR. Errors surface via the mutation state (the dialog
// shows a retry), so no toast here.
export function useEnrollTwoFactor() {
  return useMutation({
    mutationFn: () => enrollTwoFactor(),
  })
}

// Step 2/2 — confirm the authenticator code. On success 2FA is active.
// A wrong code is handled inline by the dialog, so it does not toast.
export function useConfirmTwoFactor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => confirmTwoFactor(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: securityKeys.all })
      toast.success('Autentikasi dua faktor diaktifkan')
    },
  })
}

export function useDisableTwoFactor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => disableTwoFactor(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: securityKeys.all })
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
      qc.invalidateQueries({ queryKey: securityKeys.all })
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
      qc.invalidateQueries({ queryKey: securityKeys.all })
      toast.success('Semua sesi lain diakhiri')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

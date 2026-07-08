import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { bootstrapAdmin, getCurrentUser, login, logout } from '@/api/auth'
import { authKeys } from '@/features/auth/queries/keys'
import { getErrorCode, getErrorMessage } from '@/lib/errors'
import type { BootstrapInput, LoginInput } from '@/schemas/auth'

// Login failures the form handles inline (TOTP challenge) — these must not
// raise a generic error toast (ADR-0002 error markers).
const TOTP_CHALLENGE_CODES = new Set(['totp_required', 'totp_invalid', 'totp_locked'])

import { useAuthStore } from '../store/authStore'

export function useCurrentUser() {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: getCurrentUser,
    enabled: accessToken !== null,
    staleTime: 5 * 60_000,
  })
}

export function useIsAuthenticated() {
  return useAuthStore((s) => s.accessToken !== null)
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: (session) => {
      setSession(session)
      qc.setQueryData(authKeys.me(), session.user)
    },
    onError: (err) => {
      // A TOTP challenge is not an error to the user — the form reveals the
      // code input and (on retry) shows an inline message. Skip the toast.
      const code = getErrorCode(err)
      if (code && TOTP_CHALLENGE_CODES.has(code)) return
      toast.error(getErrorMessage(err))
    },
  })
}

export function useBootstrap() {
  const setSession = useAuthStore((s) => s.setSession)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: BootstrapInput) => bootstrapAdmin(input),
    onSuccess: (session) => {
      // Bootstrap auto-logs-in the new admin; prime the session + me cache
      // and mark bootstrap done so the guard can't loop back to /bootstrap.
      setSession(session)
      qc.setQueryData(authKeys.me(), session.user)
      qc.setQueryData(authKeys.bootstrap(), { required: false })
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      // Always clear local state — even if the server logout call fails,
      // the user has chosen to leave.
      clear()
      qc.clear()
    },
  })
}

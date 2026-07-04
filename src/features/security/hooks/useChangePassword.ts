import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { changePassword } from '@/api/auth'
import { getErrorMessage } from '@/lib/errors'

/**
 * Self-service credential rotation. The confirm field is validated in the
 * form and dropped before the call; the backend re-verifies the current
 * password (POST /v1/auth/change-password).
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) => changePassword(input),
    onSuccess: () => {
      toast.success('Kata sandi berhasil diubah')
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}

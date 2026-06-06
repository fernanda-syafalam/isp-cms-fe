import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { onboardCustomer } from '@/api/onboarding'
import { getErrorMessage } from '@/lib/errors'
import type { OnboardingInput } from '@/schemas/onboarding'

export function useOnboardCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: OnboardingInput) => onboardCustomer(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['work-orders'] })
      qc.invalidateQueries({ queryKey: ['topology'] })
      toast.success('Pelanggan di-onboard, instalasi dijadwalkan & muncul di topologi')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

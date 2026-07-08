import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { onboardCustomer } from '@/api/onboarding'
import { customerKeys } from '@/features/customers/queries/keys'
import { topologyKeys } from '@/features/topology/queries/keys'
import { workOrderKeys } from '@/features/work-orders/queries/keys'
import { getErrorMessage } from '@/lib/errors'
import type { OnboardingInput } from '@/schemas/onboarding'

export function useOnboardCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: OnboardingInput) => onboardCustomer(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.all })
      qc.invalidateQueries({ queryKey: workOrderKeys.all })
      qc.invalidateQueries({ queryKey: topologyKeys.all })
      toast.success('Pelanggan di-onboard, instalasi dijadwalkan & muncul di topologi')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

import { createLazyFileRoute } from '@tanstack/react-router'

import { OnboardingWizard } from '@/features/customers'

export const Route = createLazyFileRoute('/_auth/customers/onboarding')({
  component: OnboardingWizard,
})

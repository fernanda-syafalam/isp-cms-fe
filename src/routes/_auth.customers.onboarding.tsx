import { createFileRoute } from '@tanstack/react-router'

import { OnboardingWizard } from '@/features/customers'

export const Route = createFileRoute('/_auth/customers/onboarding')({
  component: OnboardingWizard,
})

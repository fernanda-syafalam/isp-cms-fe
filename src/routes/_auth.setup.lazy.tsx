import { createLazyFileRoute } from '@tanstack/react-router'

import { SetupGuidePage } from '@/features/setup'

export const Route = createLazyFileRoute('/_auth/setup')({
  component: SetupGuidePage,
})

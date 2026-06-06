import { createLazyFileRoute } from '@tanstack/react-router'

import { SlaCreditsPage } from '@/features/sla-credits'

export const Route = createLazyFileRoute('/_auth/sla-credits')({
  component: SlaCreditsPage,
})

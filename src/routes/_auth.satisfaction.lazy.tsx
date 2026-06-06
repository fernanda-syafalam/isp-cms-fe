import { createLazyFileRoute } from '@tanstack/react-router'

import { SatisfactionPage } from '@/features/satisfaction'

export const Route = createLazyFileRoute('/_auth/satisfaction')({
  component: SatisfactionPage,
})

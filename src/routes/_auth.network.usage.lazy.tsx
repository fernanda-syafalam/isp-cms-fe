import { createLazyFileRoute } from '@tanstack/react-router'

import { UsagePage } from '@/features/usage'

export const Route = createLazyFileRoute('/_auth/network/usage')({
  component: UsagePage,
})

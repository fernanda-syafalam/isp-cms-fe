import { createFileRoute } from '@tanstack/react-router'

import { UsagePage } from '@/features/usage'

export const Route = createFileRoute('/_auth/network/usage')({
  component: UsagePage,
})

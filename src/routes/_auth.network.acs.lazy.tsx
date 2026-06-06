import { createLazyFileRoute } from '@tanstack/react-router'

import { AcsPage } from '@/features/acs'

export const Route = createLazyFileRoute('/_auth/network/acs')({
  component: AcsPage,
})

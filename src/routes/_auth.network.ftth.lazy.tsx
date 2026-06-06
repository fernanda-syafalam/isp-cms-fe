import { createLazyFileRoute } from '@tanstack/react-router'

import { OdpPage } from '@/features/ftth'

export const Route = createLazyFileRoute('/_auth/network/ftth')({
  component: OdpPage,
})

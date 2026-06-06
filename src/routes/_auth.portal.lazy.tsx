import { createLazyFileRoute } from '@tanstack/react-router'

import { CustomerPortalPage } from '@/features/portal'

export const Route = createLazyFileRoute('/_auth/portal')({
  component: CustomerPortalPage,
})

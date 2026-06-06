import { createFileRoute } from '@tanstack/react-router'

import { CustomerPortalPage } from '@/features/portal'

export const Route = createFileRoute('/_auth/portal')({
  component: CustomerPortalPage,
})

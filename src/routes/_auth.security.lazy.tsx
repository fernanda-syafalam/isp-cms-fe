import { createLazyFileRoute } from '@tanstack/react-router'

import { SecurityPage } from '@/features/security'

export const Route = createLazyFileRoute('/_auth/security')({
  component: SecurityPage,
})

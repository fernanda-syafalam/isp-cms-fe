import { createLazyFileRoute } from '@tanstack/react-router'

import { RoleGuard } from '@/features/auth'

export const Route = createLazyFileRoute('/_auth')({
  component: RoleGuard,
})

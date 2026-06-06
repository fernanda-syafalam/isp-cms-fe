import { createLazyFileRoute } from '@tanstack/react-router'

import { AuditLogPage } from '@/features/audit'

export const Route = createLazyFileRoute('/_auth/audit')({
  component: AuditLogPage,
})

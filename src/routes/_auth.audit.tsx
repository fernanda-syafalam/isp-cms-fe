import { createFileRoute } from '@tanstack/react-router'

import { AuditLogPage } from '@/features/audit'

export const Route = createFileRoute('/_auth/audit')({
  component: AuditLogPage,
})

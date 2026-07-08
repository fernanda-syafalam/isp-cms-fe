import type { AuditFilter } from '@/api/audit'

const root = ['audit'] as const

export const auditKeys = {
  all: root,
  lists: () => [...root, 'list'] as const,
  list: (filter: AuditFilter) => [...root, 'list', filter] as const,
}

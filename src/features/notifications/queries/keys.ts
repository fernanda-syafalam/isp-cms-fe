import type { NotificationLogFilter } from '@/api/notifications'

const root = ['notifications'] as const

export const notificationKeys = {
  all: root,
  templates: () => [...root, 'templates'] as const,
  logBase: () => [...root, 'log'] as const,
  log: (filter: NotificationLogFilter) => [...root, 'log', filter] as const,
}

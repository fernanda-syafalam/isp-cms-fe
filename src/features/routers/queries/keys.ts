import type { MikrotikListFilter } from '@/api/mikrotik'
import type { RouterFilter } from '@/api/routers'

const root = ['routers'] as const

export const routerKeys = {
  all: root,
  lists: () => [...root, 'list'] as const,
  list: (filter: RouterFilter) => [...root, 'list', filter] as const,
  details: () => [...root, 'detail'] as const,
  detail: (id: string) => [...root, 'detail', id] as const,
  profiles: (routerId: string) => [...root, routerId, 'profiles'] as const,
  secretsBase: (routerId: string) => [...root, routerId, 'secrets'] as const,
  secrets: (routerId: string, filter: MikrotikListFilter) =>
    [...root, routerId, 'secrets', filter] as const,
  sessionsBase: (routerId: string) => [...root, routerId, 'sessions'] as const,
  sessions: (routerId: string, filter: MikrotikListFilter) =>
    [...root, routerId, 'sessions', filter] as const,
  queuesBase: (routerId: string) => [...root, routerId, 'queues'] as const,
  queues: (routerId: string, filter: MikrotikListFilter) =>
    [...root, routerId, 'queues', filter] as const,
  pools: (routerId: string) => [...root, routerId, 'pools'] as const,
}

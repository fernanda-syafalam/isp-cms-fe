import type { ListUsersParams } from '@/api/users'

const root = ['users'] as const

export const userKeys = {
  all: root,
  lists: () => [...root, 'list'] as const,
  list: (params: ListUsersParams) => [...root, 'list', params] as const,
}

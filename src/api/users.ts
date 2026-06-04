import { api } from './client'
import {
  AppUserSchema,
  UserListSchema,
  type AppUser,
  type CreateUserInput,
  type UserList,
} from '@/schemas/user'

export type ListUsersParams = {
  // Explicit `| undefined` so callers can forward an optional cursor under
  // exactOptionalPropertyTypes (e.g. the page tracks `string | undefined`).
  cursor?: string | undefined
  limit?: number | undefined
}

export async function listUsers(params: ListUsersParams = {}): Promise<UserList> {
  const searchParams = new URLSearchParams()
  if (params.cursor) searchParams.set('cursor', params.cursor)
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit))

  const json = await api.get('users', { searchParams }).json()
  return UserListSchema.parse(json)
}

export async function createUser(input: CreateUserInput): Promise<AppUser> {
  const json = await api.post('users', { json: input }).json()
  return AppUserSchema.parse(json)
}

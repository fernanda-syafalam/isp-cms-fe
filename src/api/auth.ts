import { api } from './client'
import { SessionSchema, UserSchema, type LoginInput, type Session, type User } from '@/schemas/auth'

// All auth endpoints send credentials so the HttpOnly refresh cookie travels.
// Backend contract: POST /auth/refresh reads the cookie and returns a fresh
// access token; logout clears the cookie server-side.
const credentialsOptions = { credentials: 'include' as const }

export async function login(input: LoginInput): Promise<Session> {
  const json = await api.post('auth/login', { json: input, ...credentialsOptions }).json()
  return SessionSchema.parse(json)
}

export async function logout(): Promise<void> {
  await api.post('auth/logout', credentialsOptions)
}

export async function refreshSession(): Promise<Session> {
  const json = await api.post('auth/refresh', credentialsOptions).json()
  return SessionSchema.parse(json)
}

export async function getCurrentUser(): Promise<User> {
  const json = await api.get('auth/me').json()
  return UserSchema.parse(json)
}

export async function changePassword(input: {
  currentPassword: string
  newPassword: string
}): Promise<void> {
  await api.post('auth/change-password', { json: input })
}

import { api } from './client'
import {
  type BootstrapInput,
  type BootstrapStatus,
  BootstrapStatusSchema,
  type LoginInput,
  type Session,
  SessionSchema,
  type User,
  UserSchema,
} from '@/schemas/auth'

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

// First-run bootstrap (P3.E.1). Status is @Public; the create call auto-logs
// in the new admin, so it must carry credentials for the refresh cookie.
export async function getBootstrapStatus(): Promise<BootstrapStatus> {
  const json = await api.get('auth/bootstrap').json()
  return BootstrapStatusSchema.parse(json)
}

export async function bootstrapAdmin(input: BootstrapInput): Promise<Session> {
  const json = await api.post('auth/bootstrap', { json: input, ...credentialsOptions }).json()
  return SessionSchema.parse(json)
}

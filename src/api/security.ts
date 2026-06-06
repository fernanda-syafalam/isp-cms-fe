import { api } from './client'
import { type SecurityState, SecurityStateSchema } from '@/schemas/security'

export async function getSecurity(): Promise<SecurityState> {
  const json = await api.get('security').json()
  return SecurityStateSchema.parse(json)
}

export async function enableTwoFactor(code: string): Promise<SecurityState> {
  const json = await api.post('security/2fa/enable', { json: { code } }).json()
  return SecurityStateSchema.parse(json)
}

export async function disableTwoFactor(): Promise<SecurityState> {
  const json = await api.post('security/2fa/disable').json()
  return SecurityStateSchema.parse(json)
}

export async function revokeSession(id: string): Promise<void> {
  await api.post(`security/sessions/${id}/revoke`)
}

export async function revokeOtherSessions(): Promise<void> {
  await api.post('security/sessions/revoke-others')
}

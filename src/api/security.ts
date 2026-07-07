import { api } from './client'
import {
  type SecurityState,
  SecurityStateSchema,
  type TwoFactorEnroll,
  TwoFactorEnrollSchema,
} from '@/schemas/security'

export async function getSecurity(): Promise<SecurityState> {
  const json = await api.get('security').json()
  return SecurityStateSchema.parse(json)
}

// Step 1/2: begin enrollment — the backend persists a fresh TOTP secret
// (2FA stays disabled) and returns the otpauth URI + base32 secret.
export async function enrollTwoFactor(): Promise<TwoFactorEnroll> {
  const json = await api.post('security/2fa/enroll').json()
  return TwoFactorEnrollSchema.parse(json)
}

// Step 2/2: verify the code from the authenticator app; on success the
// backend flips twoFactorEnabled to true and returns the fresh state.
export async function confirmTwoFactor(code: string): Promise<SecurityState> {
  const json = await api.post('security/2fa/confirm', { json: { code } }).json()
  return SecurityStateSchema.parse(json)
}

// Disable 2FA. A current code is required by the backend while 2FA is active.
export async function disableTwoFactor(code: string): Promise<SecurityState> {
  const json = await api.post('security/2fa/disable', { json: { code } }).json()
  return SecurityStateSchema.parse(json)
}

export async function revokeSession(id: string): Promise<void> {
  await api.post(`security/sessions/${id}/revoke`)
}

export async function revokeOtherSessions(): Promise<void> {
  await api.post('security/sessions/revoke-others')
}

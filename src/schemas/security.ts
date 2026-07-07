import { z } from 'zod'

// Account-security state for the current user (mock): 2FA + active sessions.
export const SecuritySessionSchema = z.object({
  id: z.string(),
  device: z.string(),
  ip: z.string(),
  lastActiveAt: z.iso.datetime(),
  current: z.boolean(),
})

export const SecurityStateSchema = z.object({
  twoFactorEnabled: z.boolean(),
  sessions: z.array(SecuritySessionSchema),
})

// The 6-digit code from the authenticator app, submitted to /2fa/confirm
// (enrollment) and /2fa/disable. Same shape the backend DTO enforces.
export const TwoFactorCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Kode harus 6 digit'),
})

// Response of POST /v1/security/2fa/enroll: the otpauth URI for a QR code
// plus the raw base32 secret for manual entry. `twoFactorSecret` is the
// backend field name (not the generic `secret`) so log redaction can target
// it unambiguously — mirror it here.
export const TwoFactorEnrollSchema = z.object({
  twoFactorSecret: z.string().min(1),
  otpauthUri: z.string().min(1),
})

export type SecuritySession = z.infer<typeof SecuritySessionSchema>
export type SecurityState = z.infer<typeof SecurityStateSchema>
export type TwoFactorCodeInput = z.infer<typeof TwoFactorCodeSchema>
export type TwoFactorEnroll = z.infer<typeof TwoFactorEnrollSchema>

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

export const EnableTwoFactorSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Kode harus 6 digit'),
})

export type SecuritySession = z.infer<typeof SecuritySessionSchema>
export type SecurityState = z.infer<typeof SecurityStateSchema>
export type EnableTwoFactorInput = z.infer<typeof EnableTwoFactorSchema>

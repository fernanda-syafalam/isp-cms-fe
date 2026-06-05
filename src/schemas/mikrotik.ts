import { z } from 'zod'

// Mikrotik PPP management (mock-first). A router owns PPP profiles (bandwidth
// plans) and PPPoE secrets (subscriber accounts). Self-contained ids (string).

export const PppProfileSchema = z.object({
  id: z.string(),
  routerId: z.string(),
  name: z.string().min(1),
  rateLimit: z.string(), // e.g. "20M/20M"
  isIsolir: z.boolean(), // the profile used to throttle/suspend
})

export const PppSecretSchema = z.object({
  id: z.string(),
  routerId: z.string(),
  username: z.string().min(1),
  profileId: z.string(),
  profileName: z.string(),
  customerName: z.string().nullable(),
  disabled: z.boolean(),
  comment: z.string().nullable(),
})

export const PppProfileListSchema = z.object({
  items: z.array(PppProfileSchema),
  total: z.number().int().nonnegative(),
})

export const PppSecretListSchema = z.object({
  items: z.array(PppSecretSchema),
  total: z.number().int().nonnegative(),
})

export const CreateProfileSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(60),
  rateLimit: z.string().min(1, 'Rate limit wajib diisi').max(40),
})

export const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  rateLimit: z.string().min(1).max(40).optional(),
})

export const CreateSecretSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi').max(60),
  password: z.string().min(1, 'Password wajib diisi').max(60),
  profileId: z.string().min(1, 'Profil wajib dipilih'),
  customerName: z.string().max(120).optional(),
  comment: z.string().max(160).optional(),
})

export const UpdateSecretSchema = z.object({
  username: z.string().min(1).max(60).optional(),
  password: z.string().min(1).max(60).optional(),
  profileId: z.string().optional(),
  customerName: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),
  disabled: z.boolean().optional(),
})

export type PppProfile = z.infer<typeof PppProfileSchema>
export type PppSecret = z.infer<typeof PppSecretSchema>
export type PppProfileList = z.infer<typeof PppProfileListSchema>
export type PppSecretList = z.infer<typeof PppSecretListSchema>
export type CreateProfileInput = z.infer<typeof CreateProfileSchema>
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>
export type CreateSecretInput = z.infer<typeof CreateSecretSchema>
export type UpdateSecretInput = z.infer<typeof UpdateSecretSchema>

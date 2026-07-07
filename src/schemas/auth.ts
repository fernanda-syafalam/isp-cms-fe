import { z } from 'zod'

import { userId } from '@/types/ids'

export const LoginSchema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
  // Only sent on the second submit of a 2FA-challenged login (ADR-0002).
  // The email/password form never sets it; the login challenge adds it
  // programmatically on resubmit, so it stays optional here.
  totpCode: z.string().optional(),
})

export const UserSchema = z.object({
  id: userId,
  email: z.email(),
  fullName: z.string().min(1),
  role: z.enum(['admin', 'staff', 'customer', 'teknisi', 'mitra']),
  // The mitra principal's own reseller (ADR-0010); null for other roles.
  // Used to route a mitra to their own storefront instead of a stand-in.
  resellerId: z.string().nullable().default(null),
})

export const SessionSchema = z.object({
  accessToken: z.string().min(1),
  user: UserSchema,
})

// First-run bootstrap (P3.E.1): the instance still has zero users and needs a
// one-time create-admin step.
export const BootstrapStatusSchema = z.object({
  required: z.boolean(),
})

// Payload sent to the backend — no `role` (admin is forced server-side).
export const BootstrapInputSchema = z.object({
  email: z.email('Email tidak valid'),
  fullName: z.string().trim().min(1, 'Nama wajib diisi').max(120, 'Maksimal 120 karakter'),
  password: z.string().min(12, 'Kata sandi minimal 12 karakter').max(128, 'Maksimal 128 karakter'),
})

// Form-only schema: adds a confirmation field that never leaves the client.
export const BootstrapFormSchema = BootstrapInputSchema.extend({
  confirmPassword: z.string(),
}).refine((v) => v.password === v.confirmPassword, {
  message: 'Konfirmasi kata sandi tidak cocok',
  path: ['confirmPassword'],
})

export type LoginInput = z.infer<typeof LoginSchema>
export type User = z.infer<typeof UserSchema>
export type Session = z.infer<typeof SessionSchema>
export type BootstrapStatus = z.infer<typeof BootstrapStatusSchema>
export type BootstrapInput = z.infer<typeof BootstrapInputSchema>
export type BootstrapFormValues = z.infer<typeof BootstrapFormSchema>

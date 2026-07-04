import { z } from 'zod'

import { userId } from '@/types/ids'

export const UserRoleSchema = z.enum(['admin', 'staff', 'customer', 'teknisi', 'mitra'])

// Named AppUser to avoid colliding with the auth `User` (the authenticated
// principal). This is the user record managed via the /users admin surface.
export const AppUserSchema = z.object({
  id: userId,
  email: z.email(),
  fullName: z.string().min(1),
  role: UserRoleSchema,
  createdAt: z.iso.datetime(),
})

export const UserListSchema = z.object({
  items: z.array(AppUserSchema),
  nextCursor: z.string().nullable(),
})

export const CreateUserSchema = z.object({
  email: z.email('Invalid email'),
  fullName: z.string().min(1, 'Name is required').max(120),
  password: z.string().min(12, 'Min 12 characters').max(128, 'Max 128 characters'),
  // No .default() here: the form always supplies a role (the Select is never
  // empty) and the backend applies its own default. Keeping input === output
  // also keeps the zodResolver generics sound under exactOptionalPropertyTypes.
  role: UserRoleSchema,
})

// Edit an existing staff account: name and/or role. Email and password are not
// editable here (identity / credential changes are a separate concern).
export const UpdateUserSchema = z.object({
  fullName: z.string().min(1, 'Name is required').max(120).optional(),
  role: UserRoleSchema.optional(),
})

export type UserRole = z.infer<typeof UserRoleSchema>
export type AppUser = z.infer<typeof AppUserSchema>
export type UserList = z.infer<typeof UserListSchema>
export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>

// Self-service credential rotation (POST /v1/auth/change-password). The
// backend re-verifies the current password; the confirm field is a UI-only
// guard against typos and is not sent.
export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
    newPassword: z.string().min(12, 'Min 12 karakter').max(128, 'Maks 128 karakter'),
    confirmPassword: z.string().min(1, 'Konfirmasi kata sandi'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Konfirmasi tidak cocok',
    path: ['confirmPassword'],
  })

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>

// Response of an admin password reset — the one-time password shown once.
export const ResetPasswordResultSchema = z.object({
  initialPassword: z.string(),
})

export type ResetPasswordResult = z.infer<typeof ResetPasswordResultSchema>

import { z } from 'zod'

import { userId } from '@/types/ids'

export const LoginSchema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
})

export const UserSchema = z.object({
  id: userId,
  email: z.email(),
  fullName: z.string().min(1),
  role: z.enum(['admin', 'staff', 'customer']),
})

export const SessionSchema = z.object({
  accessToken: z.string().min(1),
  user: UserSchema,
})

export type LoginInput = z.infer<typeof LoginSchema>
export type User = z.infer<typeof UserSchema>
export type Session = z.infer<typeof SessionSchema>

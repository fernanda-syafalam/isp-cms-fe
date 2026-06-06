import { z } from 'zod'

// App-wide operator settings (mock, single record). Company profile feeds
// printed invoices; billing params drive the billing run + isolir flows.
export const SettingsSchema = z.object({
  company: z.object({
    name: z.string().min(1),
    address: z.string(),
    phone: z.string(),
    email: z.string(),
  }),
  billing: z.object({
    lateFeeIdr: z.number().int().nonnegative(), // denda keterlambatan
    dueDays: z.number().int().positive(), // tempo sejak tagihan terbit
    isolirGraceDays: z.number().int().nonnegative(), // toleransi sebelum isolir
  }),
})

// Partial update — each section optional, validated with user-facing messages.
export const UpdateSettingsSchema = z.object({
  company: z
    .object({
      name: z.string().min(1, 'Nama wajib diisi').max(120),
      address: z.string().max(255),
      phone: z.string().max(40),
      email: z.string().max(120),
    })
    .optional(),
  billing: z
    .object({
      lateFeeIdr: z.number().int().nonnegative().max(10_000_000),
      dueDays: z.number().int().positive().max(60),
      isolirGraceDays: z.number().int().nonnegative().max(60),
    })
    .optional(),
})

export type Settings = z.infer<typeof SettingsSchema>
export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>

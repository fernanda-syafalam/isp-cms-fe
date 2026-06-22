import { z } from 'zod'

// Single source of truth for the settings form: validation + the inferred
// value type, shared by the page and each section's fieldset component.
export const SettingsFormSchema = z.object({
  company: z.object({
    name: z.string().min(1, 'Nama wajib diisi').max(120),
    address: z.string().max(255),
    phone: z.string().max(40),
    email: z.string().max(120),
  }),
  billing: z.object({
    lateFeeIdr: z.number().int().nonnegative('Tidak boleh negatif').max(10_000_000),
    dueDays: z.number().int().positive('Minimal 1 hari').max(60),
    isolirGraceDays: z.number().int().nonnegative('Tidak boleh negatif').max(60),
  }),
  tax: z.object({
    pkp: z.boolean(),
    npwp: z.string().max(40),
    ppnRate: z.number().nonnegative('Tidak boleh negatif').max(1),
  }),
})

export type SettingsFormValues = z.infer<typeof SettingsFormSchema>

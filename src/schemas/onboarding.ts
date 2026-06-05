import { z } from 'zod'

// End-to-end subscriber onboarding: data → plan → install schedule.
// On submit the backend (mock) creates the customer (status "instalasi") plus
// an install work order.
export const OnboardingSchema = z.object({
  fullName: z.string().min(1, 'Nama wajib diisi').max(120),
  phone: z.string().min(6, 'Telepon wajib diisi').max(20),
  email: z.email('Email tidak valid').or(z.literal('')),
  address: z.string().min(1, 'Alamat wajib diisi').max(255),
  areaName: z.string().min(1, 'Area wajib dipilih'),
  planId: z.string().min(1, 'Paket wajib dipilih'),
  technician: z.string().min(1, 'Teknisi wajib dipilih'),
  scheduledAt: z.string().min(1, 'Jadwal instalasi wajib diisi'),
  note: z.string().max(300).optional(),
})

export type OnboardingInput = z.infer<typeof OnboardingSchema>

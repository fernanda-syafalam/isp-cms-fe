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
  // Install coordinates picked on the map (Shopee-style); drives the new
  // customer's node on the topology map.
  lat: z.number().optional(),
  lng: z.number().optional(),
  // Chosen FTTH distribution point. The backend reserves a splitter port
  // atomically on submit (409 if the ODP is already full).
  odpId: z.string().optional(),
  // KYC identity (UU PDP). Optional at onboarding — ops can complete it later.
  ktp: z.string().max(32).optional(),
  npwp: z.string().max(40).optional(),
  // UU PDP data-processing consent given at onboarding.
  consent: z.boolean().optional(),
})

export type OnboardingInput = z.infer<typeof OnboardingSchema>

import { z } from 'zod'

import { CustomerSchema } from '@/schemas/customer'

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
  // Referral/reseller attribution (P3.D.2): the mitra that brought this
  // customer. Optional — null when onboarded directly.
  resellerId: z.uuid('Reseller tidak valid').nullable().optional(),
})

export type OnboardingInput = z.infer<typeof OnboardingSchema>

// Response of POST /onboarding: the created customer PLUS the portal login the
// backend provisions for the subscriber (mirrors the BE OnboardResponseDto).
// `portalLogin` is null when the wizard had no email (or the email already
// belongs to a user). The `initialPassword` is a one-time secret — it is shown
// ONCE in the success dialog and never returned again.
export const OnboardResponseSchema = CustomerSchema.extend({
  portalLogin: z
    .object({
      email: z.email(),
      initialPassword: z.string(),
    })
    .nullable(),
})

export type OnboardResponse = z.infer<typeof OnboardResponseSchema>

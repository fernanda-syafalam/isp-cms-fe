import { z } from 'zod'

// Sales pipeline lead: new → survey → quote → won (convert) | lost.
export const LeadStageSchema = z.enum(['new', 'survey', 'quote', 'won', 'lost'])
export const LeadSourceSchema = z.enum(['walk_in', 'referral', 'online', 'reseller'])

export const LeadSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  address: z.string(),
  areaName: z.string(),
  planName: z.string(), // package of interest
  stage: LeadStageSchema,
  estValue: z.number().int().nonnegative(), // est. monthly value (IDR)
  source: LeadSourceSchema,
  note: z.string().nullable(),
  createdAt: z.iso.datetime(),
})

export const LeadListSchema = z.object({
  items: z.array(LeadSchema),
  total: z.number().int().nonnegative(),
})

export const CreateLeadSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(120),
  phone: z.string().min(1, 'Telepon wajib diisi').max(20),
  address: z.string().min(1, 'Alamat wajib diisi').max(255),
  areaName: z.string().min(1, 'Area wajib dipilih'),
  planName: z.string().min(1, 'Paket wajib dipilih'),
  estValue: z.number().int().nonnegative(),
  source: LeadSourceSchema,
  note: z.string().max(500).optional(),
})

export const UpdateLeadStageSchema = z.object({ stage: LeadStageSchema })

export type LeadStage = z.infer<typeof LeadStageSchema>
export type LeadSource = z.infer<typeof LeadSourceSchema>
export type Lead = z.infer<typeof LeadSchema>
export type LeadList = z.infer<typeof LeadListSchema>
export type CreateLeadInput = z.infer<typeof CreateLeadSchema>

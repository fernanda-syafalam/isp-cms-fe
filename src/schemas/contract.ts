import { z } from 'zod'

import { customerId } from '@/types/ids'

// Subscription agreement (PKS). draft → sent (for e-signature) → signed.
export const ContractStatusSchema = z.enum(['draft', 'sent', 'signed'])

export const ContractSchema = z.object({
  id: z.string(),
  number: z.string(), // e.g. "PKS-2026-0001"
  customerId: customerId,
  customerName: z.string(),
  planName: z.string(),
  status: ContractStatusSchema,
  meterai: z.boolean(), // e-Meterai applied
  createdAt: z.iso.datetime(),
  signedAt: z.iso.datetime().nullable(),
})

// GET wrapper so "no contract yet" is a clean null instead of a 404.
export const ContractResponseSchema = z.object({
  contract: ContractSchema.nullable(),
})

export type ContractStatus = z.infer<typeof ContractStatusSchema>
export type Contract = z.infer<typeof ContractSchema>
export type ContractResponse = z.infer<typeof ContractResponseSchema>

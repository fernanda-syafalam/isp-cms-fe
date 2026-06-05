import { z } from 'zod'

import { areaId, customerId, planId } from '@/types/ids'

export const CustomerStatusSchema = z.enum(['active', 'pending', 'suspended', 'inactive'])

export const CustomerSchema = z.object({
  id: customerId,
  customerNo: z.string(),
  fullName: z.string().min(1),
  phone: z.string(),
  email: z.email().nullable(),
  address: z.string(),
  areaId: areaId,
  areaName: z.string(),
  planId: planId,
  planName: z.string(),
  status: CustomerStatusSchema,
  joinedAt: z.iso.datetime(),
})

export const CustomerListSchema = z.object({
  items: z.array(CustomerSchema),
  total: z.number().int().nonnegative(),
})

export const CreateCustomerSchema = z.object({
  fullName: z.string().min(1, 'Name is required').max(120),
  phone: z.string().min(6, 'Phone is required').max(20),
  email: z.email('Invalid email').or(z.literal('')),
  address: z.string().min(1, 'Address is required').max(255),
  planId: z.string().min(1, 'Plan is required'),
})

export type CustomerStatus = z.infer<typeof CustomerStatusSchema>
export type Customer = z.infer<typeof CustomerSchema>
export type CustomerList = z.infer<typeof CustomerListSchema>
export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>

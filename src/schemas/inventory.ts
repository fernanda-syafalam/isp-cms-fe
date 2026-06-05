import { z } from 'zod'

import { inventoryId } from '@/types/ids'

export const InventoryKindSchema = z.enum(['onu', 'router', 'mikrotik'])
export const InventoryStatusSchema = z.enum(['warehouse', 'installed', 'broken'])

export const InventoryItemSchema = z.object({
  id: inventoryId,
  kind: InventoryKindSchema,
  serial: z.string(),
  status: InventoryStatusSchema,
  assignedTo: z.string().nullable(), // customer name when installed
})

export const InventoryListSchema = z.object({
  items: z.array(InventoryItemSchema),
  total: z.number().int().nonnegative(),
})

export const UpdateInventorySchema = z.object({
  kind: InventoryKindSchema.optional(),
  serial: z.string().min(1, 'Serial wajib diisi').max(80).optional(),
  status: InventoryStatusSchema.optional(),
  assignedTo: z.string().nullable().optional(),
})

export type InventoryKind = z.infer<typeof InventoryKindSchema>
export type InventoryStatus = z.infer<typeof InventoryStatusSchema>
export type InventoryItem = z.infer<typeof InventoryItemSchema>
export type InventoryList = z.infer<typeof InventoryListSchema>
export type UpdateInventoryInput = z.infer<typeof UpdateInventorySchema>

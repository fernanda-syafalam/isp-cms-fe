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

export type InventoryKind = z.infer<typeof InventoryKindSchema>
export type InventoryStatus = z.infer<typeof InventoryStatusSchema>
export type InventoryItem = z.infer<typeof InventoryItemSchema>
export type InventoryList = z.infer<typeof InventoryListSchema>

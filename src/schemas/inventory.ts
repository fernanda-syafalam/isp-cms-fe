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

// Stock-in: register a new device into the warehouse.
export const StockInSchema = z.object({
  kind: InventoryKindSchema,
  serial: z.string().min(1, 'Serial wajib diisi').max(80),
})

// Stock movement log: every status transition leaves a trail.
export const StockMovementTypeSchema = z.enum(['in', 'assign', 'return', 'broken'])

export const StockMovementSchema = z.object({
  id: z.string(),
  itemId: inventoryId,
  serial: z.string(),
  kind: InventoryKindSchema,
  type: StockMovementTypeSchema,
  note: z.string(), // customer name (assign) / reason / "Stok masuk"
  at: z.iso.datetime(),
})

export const StockMovementListSchema = z.object({
  items: z.array(StockMovementSchema),
  total: z.number().int().nonnegative(),
})

// Move an item: assign (→ installed, note = customer), return (→ warehouse), or
// mark broken. Sent as a positive intent; the mock applies status + logs it.
export const MoveInventorySchema = z.object({
  type: z.enum(['assign', 'return', 'broken']),
  note: z.string().max(120).optional(),
})

export type InventoryKind = z.infer<typeof InventoryKindSchema>
export type InventoryStatus = z.infer<typeof InventoryStatusSchema>
export type InventoryItem = z.infer<typeof InventoryItemSchema>
export type InventoryList = z.infer<typeof InventoryListSchema>
export type UpdateInventoryInput = z.infer<typeof UpdateInventorySchema>
export type StockInInput = z.infer<typeof StockInSchema>
export type StockMovementType = z.infer<typeof StockMovementTypeSchema>
export type StockMovement = z.infer<typeof StockMovementSchema>
export type StockMovementList = z.infer<typeof StockMovementListSchema>
export type MoveInventoryInput = z.infer<typeof MoveInventorySchema>

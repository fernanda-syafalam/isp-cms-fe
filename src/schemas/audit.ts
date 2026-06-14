import { z } from 'zod'

// Audit trail of mutating actions across the app (mock).
export const AuditEntrySchema = z.object({
  id: z.string(),
  at: z.iso.datetime(),
  actor: z.string(), // who performed it
  action: z.string(), // short verb-phrase, e.g. "billing.run"
  entity: z.string(), // affected domain, e.g. "Tagihan", "Pelanggan"
  summary: z.string(), // human-readable description
  entityId: z.string().optional(), // affected record id, for per-record history
})

export const AuditListSchema = z.object({
  items: z.array(AuditEntrySchema),
  total: z.number().int().nonnegative(),
})

export type AuditEntry = z.infer<typeof AuditEntrySchema>
export type AuditList = z.infer<typeof AuditListSchema>

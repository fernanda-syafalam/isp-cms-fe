import { z } from 'zod'

// General-ledger journal line for accounting export (mock; cash-basis from
// settled invoices). Each line is one side of a double-entry posting.
export const JournalLineSchema = z.object({
  id: z.string(),
  date: z.iso.datetime(),
  accountCode: z.string(),
  accountName: z.string(),
  description: z.string(),
  debit: z.number().int().nonnegative(),
  credit: z.number().int().nonnegative(),
})

export const JournalSchema = z.object({
  period: z.string(), // "YYYY-MM"
  lines: z.array(JournalLineSchema),
  totals: z.object({
    debit: z.number().int().nonnegative(),
    credit: z.number().int().nonnegative(),
  }),
})

export type JournalLine = z.infer<typeof JournalLineSchema>
export type Journal = z.infer<typeof JournalSchema>

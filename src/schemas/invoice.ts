import { z } from 'zod'

import { customerId, invoiceId } from '@/types/ids'

// `partial` = some (but not all) of the balance has been paid (P3.A.4 partial
// payments / loket). It still owes `balanceDue` and is treated as unpaid.
export const InvoiceStatusSchema = z.enum(['paid', 'partial', 'pending', 'overdue', 'draft'])

export const InvoiceSchema = z.object({
  id: invoiceId,
  invoiceNo: z.string(),
  customerId: customerId,
  customerName: z.string(),
  periodStart: z.iso.date(),
  periodEnd: z.iso.date(),
  amount: z.number().int().nonnegative(), // DPP / harga langganan
  lateFee: z.number().int().nonnegative(), // denda keterlambatan
  taxAmount: z.number().int().nonnegative(), // PPN (efektif 11% via DPP 11/12)
  discountAmount: z.number().int().nonnegative(), // potongan/diskon (IDR)
  paidAmount: z.number().int().nonnegative(), // total sudah dibayar (IDR)
  // Sisa tertagih = amount + lateFee + taxAmount − discountAmount − paidAmount.
  balanceDue: z.number().int().nonnegative(),
  // Nomor faktur pajak (e-Faktur/Coretax) — null untuk non-PKP.
  taxInvoiceNo: z.string().nullable(),
  status: InvoiceStatusSchema,
  dueDate: z.iso.date(),
  paidAt: z.iso.datetime().nullable(),
  // Last time a payment reminder (dunning) was sent for this invoice.
  lastRemindedAt: z.iso.datetime().nullable(),
})

// Accounts-receivable rollup over ALL invoices, computed before any status/q
// filter or paging — so the AR KPI cards stay a dashboard invariant under any
// table filter (mirrors the accounting journal `totals` invariant). Amounts are
// grand totals (DPP + late fee + PPN), in IDR.
export const InvoiceSummarySchema = z.object({
  outstanding: z.number().int().nonnegative(), // sum over pending + overdue
  overdue: z.number().int().nonnegative(), // sum over overdue only
  unpaidCount: z.number().int().nonnegative(), // count of pending + overdue
  total: z.number().int().nonnegative(), // count of ALL invoices
  // Per-status counts (over ALL invoices) — drives the status filter tabs.
  byStatus: z.object({
    paid: z.number().int().nonnegative(),
    partial: z.number().int().nonnegative(),
    pending: z.number().int().nonnegative(),
    overdue: z.number().int().nonnegative(),
    draft: z.number().int().nonnegative(),
  }),
})

export const InvoiceListSchema = z.object({
  items: z.array(InvoiceSchema),
  // Count AFTER status+q filtering but BEFORE limit/offset paging — drives the
  // table's page count. `items` is the current page; `total` the filtered set.
  total: z.number().int().nonnegative(),
  summary: InvoiceSummarySchema,
})

export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>
export type Invoice = z.infer<typeof InvoiceSchema>
export type InvoiceSummary = z.infer<typeof InvoiceSummarySchema>
export type InvoiceList = z.infer<typeof InvoiceListSchema>

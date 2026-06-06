import type { Invoice } from '@/schemas/invoice'

// Grand total a customer pays: DPP (amount) + denda + PPN.
export function invoiceTotal(inv: Pick<Invoice, 'amount' | 'lateFee' | 'taxAmount'>): number {
  return inv.amount + inv.lateFee + inv.taxAmount
}

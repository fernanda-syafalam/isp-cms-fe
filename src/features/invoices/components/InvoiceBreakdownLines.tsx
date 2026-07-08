import { formatCurrency } from '@/lib/format'
import { invoiceTotal } from '@/lib/invoice'
import type { Invoice } from '@/schemas/invoice'

type Props = {
  invoice: Invoice
  // When true the outstanding balance (Sisa tagihan) renders as the prominent
  // bottom-line figure (full detail page); otherwise it is a compact row (the
  // quick-view drawer). Single source of truth for the money breakdown shared
  // by InvoiceBreakdown (drawer) and InvoiceDetailPage (card).
  emphasizeBalanceDue?: boolean
}

// Itemised money breakdown for an invoice: DPP, PPN, late fee, discount (−),
// the gross "total tagihan", the amount already paid (−), and the outstanding
// `balanceDue` (Sisa tagihan) as the bottom-line amount owed. Discount and paid
// rows show only when non-zero so a plain invoice stays clean; when a credit or
// payment exists it is never invisible and the owed figure is net, matching the
// backend's `balanceDue`.
export function InvoiceBreakdownLines({ invoice, emphasizeBalanceDue = false }: Props) {
  const grossTotal = invoiceTotal(invoice)
  const settled = invoice.balanceDue <= 0

  return (
    <div className="space-y-2 rounded-lg border border-sidebar-border p-4 text-sm">
      <Row label="DPP (langganan)" value={formatCurrency(invoice.amount)} />
      {invoice.taxAmount > 0 ? <Row label="PPN" value={formatCurrency(invoice.taxAmount)} /> : null}
      {invoice.lateFee > 0 ? (
        <Row label="Denda keterlambatan" value={formatCurrency(invoice.lateFee)} danger />
      ) : null}
      {invoice.discountAmount > 0 ? (
        <Row label="Diskon" value={`- ${formatCurrency(invoice.discountAmount)}`} credit />
      ) : null}
      <div className="flex items-center justify-between border-sidebar-border border-t pt-2">
        <span className="text-muted-foreground">Total tagihan</span>
        <span className="font-bold font-mono tabular-nums">{formatCurrency(grossTotal)}</span>
      </div>
      {invoice.paidAmount > 0 ? (
        <Row label="Sudah dibayar" value={`- ${formatCurrency(invoice.paidAmount)}`} credit />
      ) : null}
      {emphasizeBalanceDue ? (
        <div className="flex items-center justify-between border-sidebar-border border-t pt-3">
          <span className="text-muted-foreground">Sisa tagihan</span>
          <span
            className={
              settled
                ? 'font-bold font-mono text-2xl text-emerald-600 tabular-nums tracking-tight dark:text-emerald-400'
                : 'font-bold font-mono text-2xl tabular-nums tracking-tight'
            }
          >
            {formatCurrency(invoice.balanceDue)}
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Sisa tagihan</span>
          <span
            className={
              settled
                ? 'font-mono text-emerald-600 tabular-nums dark:text-emerald-400'
                : 'font-mono font-semibold tabular-nums'
            }
          >
            {formatCurrency(invoice.balanceDue)}
          </span>
        </div>
      )}
    </div>
  )
}

function Row({
  label,
  value,
  danger = false,
  credit = false,
}: {
  label: string
  value: string
  danger?: boolean
  credit?: boolean
}) {
  const valueClass = danger
    ? 'font-mono text-red-600 tabular-nums dark:text-red-400'
    : credit
      ? 'font-mono text-emerald-600 tabular-nums dark:text-emerald-400'
      : 'font-mono tabular-nums'
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  )
}

import { DetailSection } from '@/components/shared/detail-sheet'
import { formatCurrency } from '@/lib/format'
import { invoiceTotal } from '@/lib/invoice'
import type { Invoice } from '@/schemas/invoice'

// "Rincian" amount breakdown for the invoice quick-view drawer: DPP, PPN, late
// fee, total, and the outstanding/paid balance line.
export function InvoiceBreakdown({ invoice }: { invoice: Invoice }) {
  const total = invoiceTotal(invoice)
  const paid = invoice.status === 'paid'

  return (
    <DetailSection title="Rincian">
      <div className="space-y-2 rounded-lg border border-sidebar-border p-4 text-sm">
        <TotalRow label="DPP (langganan)" value={formatCurrency(invoice.amount)} />
        {invoice.taxAmount > 0 ? (
          <TotalRow label="PPN" value={formatCurrency(invoice.taxAmount)} />
        ) : null}
        {invoice.lateFee > 0 ? (
          <TotalRow label="Denda keterlambatan" value={formatCurrency(invoice.lateFee)} danger />
        ) : null}
        <div className="flex items-center justify-between border-sidebar-border border-t pt-2">
          <span className="text-muted-foreground">Total tagihan</span>
          <span className="font-bold font-mono tabular-nums">{formatCurrency(total)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{paid ? 'Dibayar' : 'Saldo tertagih'}</span>
          <span
            className={
              paid
                ? 'font-mono text-emerald-600 tabular-nums dark:text-emerald-400'
                : 'font-mono font-semibold tabular-nums'
            }
          >
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </DetailSection>
  )
}

function TotalRow({
  label,
  value,
  danger = false,
}: {
  label: string
  value: string
  danger?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          danger
            ? 'font-mono text-red-600 tabular-nums dark:text-red-400'
            : 'font-mono tabular-nums'
        }
      >
        {value}
      </span>
    </div>
  )
}

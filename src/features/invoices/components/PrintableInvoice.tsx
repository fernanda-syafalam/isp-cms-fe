import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import { invoiceTotal } from '@/lib/invoice'
import { statusLabel } from '@/lib/status-label'
import type { Invoice } from '@/schemas/invoice'

type Issuer = {
  name: string
  tagline?: string
  address: string
  phone: string
  email: string
  npwp?: string
}

// Fallback issuer profile. InvoicePrintPage passes the live Settings profile.
const DEFAULT_ISSUER: Issuer = {
  name: 'Jepara Net',
  tagline: 'Layanan Internet',
  address: 'Jl. Pemuda No. 12, Jepara, Jawa Tengah',
  phone: '0291-591234',
  email: 'billing@jeparanet.id',
}

type Props = {
  invoice: Invoice
  issuer?: Issuer | undefined
  buyerNpwp?: string | null
}

// A print-ready invoice (FAKTUR) or, when paid, a receipt (KWITANSI).
// Colors are explicit black-on-white because this is a paper document, not an
// app surface — theme/dark-mode tokens do not apply to print output.
export function PrintableInvoice({ invoice, issuer = DEFAULT_ISSUER, buyerNpwp }: Props) {
  const isPaid = invoice.status === 'paid'
  const total = invoiceTotal(invoice)
  const docTitle = isPaid ? 'KWITANSI' : 'FAKTUR'

  return (
    <article className="mx-auto max-w-[800px] bg-white px-10 py-12 text-neutral-900">
      {/* Header */}
      <header className="flex items-start justify-between border-neutral-300 border-b pb-6">
        <div>
          <p className="font-bold text-2xl tracking-tight text-blue-700">{issuer.name}</p>
          {issuer.tagline ? <p className="text-neutral-600 text-sm">{issuer.tagline}</p> : null}
          <p className="mt-2 text-neutral-500 text-xs leading-relaxed">
            {issuer.address}
            <br />
            {issuer.phone} · {issuer.email}
            {issuer.npwp ? (
              <>
                <br />
                NPWP: {issuer.npwp}
              </>
            ) : null}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-neutral-500 text-sm uppercase tracking-widest">
            {docTitle}
          </p>
          <p className="mt-1 font-mono font-semibold text-lg">{invoice.invoiceNo}</p>
          <p className="mt-1 text-neutral-600 text-sm">Status: {statusLabel(invoice.status)}</p>
          {invoice.taxInvoiceNo ? (
            <p className="mt-1 text-neutral-500 text-xs">
              Faktur Pajak: <span className="font-mono">{invoice.taxInvoiceNo}</span>
            </p>
          ) : null}
        </div>
      </header>

      {/* Meta: bill-to + dates */}
      <section className="mt-6 flex justify-between gap-8">
        <div>
          <p className="text-neutral-500 text-xs uppercase tracking-wide">Ditagihkan kepada</p>
          <p className="mt-1 font-medium text-base">{invoice.customerName}</p>
          {buyerNpwp ? <p className="text-neutral-500 text-xs">NPWP: {buyerNpwp}</p> : null}
        </div>
        <dl className="space-y-1 text-right text-sm">
          <div className="flex justify-between gap-8">
            <dt className="text-neutral-500">Periode</dt>
            <dd>
              {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
            </dd>
          </div>
          <div className="flex justify-between gap-8">
            <dt className="text-neutral-500">Jatuh tempo</dt>
            <dd>{formatDate(invoice.dueDate)}</dd>
          </div>
          {invoice.paidAt ? (
            <div className="flex justify-between gap-8">
              <dt className="text-neutral-500">Dibayar pada</dt>
              <dd>{formatDateTime(invoice.paidAt)}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      {/* Line item + tax breakdown */}
      <table className="mt-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-neutral-300 border-y text-left">
            <th className="py-2 font-semibold">Deskripsi</th>
            <th className="py-2 text-right font-semibold">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-neutral-200 border-b">
            <td className="py-3 pr-4">
              Langganan internet — periode {formatDate(invoice.periodStart)} s/d{' '}
              {formatDate(invoice.periodEnd)}
            </td>
            <td className="py-3 text-right font-mono tabular-nums">
              {formatCurrency(invoice.amount)}
            </td>
          </tr>
          {invoice.lateFee > 0 ? (
            <tr className="border-neutral-200 border-b">
              <td className="py-3 pr-4">Denda keterlambatan</td>
              <td className="py-3 text-right font-mono tabular-nums">
                {formatCurrency(invoice.lateFee)}
              </td>
            </tr>
          ) : null}
        </tbody>
        <tfoot>
          <tr>
            <td className="py-1 text-right text-neutral-500">DPP</td>
            <td className="py-1 text-right font-mono tabular-nums">
              {formatCurrency(invoice.amount + invoice.lateFee)}
            </td>
          </tr>
          {invoice.taxAmount > 0 ? (
            <tr>
              <td className="py-1 text-right text-neutral-500">PPN</td>
              <td className="py-1 text-right font-mono tabular-nums">
                {formatCurrency(invoice.taxAmount)}
              </td>
            </tr>
          ) : null}
          <tr>
            <td className="py-3 text-right font-semibold">Total</td>
            <td className="py-3 text-right font-mono font-bold text-lg tabular-nums">
              {formatCurrency(total)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Paid stamp */}
      {isPaid ? (
        <div className="mt-6 inline-block rounded-md border-2 border-green-600 px-4 py-1.5 font-bold text-green-700 text-sm uppercase tracking-widest">
          Lunas
        </div>
      ) : (
        <p className="mt-6 text-neutral-600 text-sm">
          Mohon lakukan pembayaran sebelum tanggal jatuh tempo untuk menghindari isolir layanan.
        </p>
      )}

      {/* Footer */}
      <footer className="mt-12 border-neutral-300 border-t pt-4 text-center text-neutral-500 text-xs">
        Terima kasih atas kepercayaan Anda menggunakan layanan {issuer.name}.
        <br />
        Dokumen ini sah dan diproses secara elektronik tanpa tanda tangan.
      </footer>
    </article>
  )
}

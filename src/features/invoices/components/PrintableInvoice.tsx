import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import { statusLabel } from '@/lib/status-label'
import type { Invoice } from '@/schemas/invoice'

// Static issuer profile. A future Settings page (B10) can make this editable.
const COMPANY = {
  name: 'Ashnet',
  tagline: 'Layanan Internet',
  address: 'Jl. Merdeka No. 1, Jakarta',
  phone: '0800-1-274638',
  email: 'billing@ashnet.id',
} as const

type Props = {
  invoice: Invoice
}

// A print-ready invoice (FAKTUR) or, when paid, a receipt (KWITANSI).
// Colors are explicit black-on-white because this is a paper document, not an
// app surface — theme/dark-mode tokens do not apply to print output.
export function PrintableInvoice({ invoice }: Props) {
  const isPaid = invoice.status === 'paid'
  const total = invoice.amount + invoice.lateFee
  const docTitle = isPaid ? 'KWITANSI' : 'FAKTUR'

  const lineItems: Array<{ label: string; amount: number }> = [
    {
      label: `Langganan internet — periode ${formatDate(invoice.periodStart)} s/d ${formatDate(invoice.periodEnd)}`,
      amount: invoice.amount,
    },
  ]
  if (invoice.lateFee > 0) {
    lineItems.push({ label: 'Denda keterlambatan', amount: invoice.lateFee })
  }

  return (
    <article className="mx-auto max-w-[800px] bg-white px-10 py-12 text-neutral-900">
      {/* Header */}
      <header className="flex items-start justify-between border-neutral-300 border-b pb-6">
        <div>
          <p className="font-bold text-2xl tracking-tight text-blue-700">{COMPANY.name}</p>
          <p className="text-neutral-600 text-sm">{COMPANY.tagline}</p>
          <p className="mt-2 text-neutral-500 text-xs leading-relaxed">
            {COMPANY.address}
            <br />
            {COMPANY.phone} · {COMPANY.email}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-neutral-500 text-sm uppercase tracking-widest">
            {docTitle}
          </p>
          <p className="mt-1 font-mono font-semibold text-lg">{invoice.invoiceNo}</p>
          <p className="mt-1 text-neutral-600 text-sm">Status: {statusLabel(invoice.status)}</p>
        </div>
      </header>

      {/* Meta: bill-to + dates */}
      <section className="mt-6 flex justify-between gap-8">
        <div>
          <p className="text-neutral-500 text-xs uppercase tracking-wide">Ditagihkan kepada</p>
          <p className="mt-1 font-medium text-base">{invoice.customerName}</p>
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

      {/* Line items */}
      <table className="mt-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-neutral-300 border-y text-left">
            <th className="py-2 font-semibold">Deskripsi</th>
            <th className="py-2 text-right font-semibold">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item) => (
            <tr key={item.label} className="border-neutral-200 border-b">
              <td className="py-3 pr-4">{item.label}</td>
              <td className="py-3 text-right font-mono tabular-nums">
                {formatCurrency(item.amount)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="py-4 text-right font-semibold">Total</td>
            <td className="py-4 text-right font-mono font-bold text-lg tabular-nums">
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
        Terima kasih atas kepercayaan Anda menggunakan layanan {COMPANY.name}.
        <br />
        Dokumen ini sah dan diproses secara elektronik tanpa tanda tangan.
      </footer>
    </article>
  )
}

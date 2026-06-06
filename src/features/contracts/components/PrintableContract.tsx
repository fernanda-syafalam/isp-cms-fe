import { formatDate } from '@/lib/format'
import type { Contract } from '@/schemas/contract'

type Props = {
  contract: Contract
  customerAddress?: string
}

// A print-ready subscription agreement (PKS). Explicit black-on-white because
// it's a paper document; pairs with the global @media print rule.
export function PrintableContract({ contract, customerAddress }: Props) {
  return (
    <article className="mx-auto max-w-[800px] bg-white px-10 py-12 text-neutral-900">
      <header className="border-neutral-300 border-b pb-6 text-center">
        <p className="font-bold text-xl tracking-tight">
          PERJANJIAN KERJA SAMA BERLANGGANAN INTERNET
        </p>
        <p className="mt-1 font-mono text-neutral-500 text-sm">{contract.number}</p>
      </header>

      <p className="mt-6 text-sm leading-relaxed">
        Perjanjian ini dibuat antara <span className="font-semibold">Ashnet</span> (selanjutnya
        disebut "Penyedia Layanan") dan pelanggan berikut (selanjutnya disebut "Pelanggan"):
      </p>

      <dl className="mt-4 space-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="w-32 text-neutral-500">Nama Pelanggan</dt>
          <dd className="font-medium">: {contract.customerName}</dd>
        </div>
        {customerAddress ? (
          <div className="flex gap-2">
            <dt className="w-32 text-neutral-500">Alamat</dt>
            <dd>: {customerAddress}</dd>
          </div>
        ) : null}
        <div className="flex gap-2">
          <dt className="w-32 text-neutral-500">Paket Layanan</dt>
          <dd>: {contract.planName}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-32 text-neutral-500">Tanggal</dt>
          <dd>: {formatDate(contract.createdAt)}</dd>
        </div>
      </dl>

      <section className="mt-6 space-y-2 text-sm leading-relaxed">
        <p className="font-semibold">Ketentuan Utama</p>
        <ol className="list-decimal space-y-1 pl-5 text-neutral-700">
          <li>Penyedia Layanan menyediakan akses internet sesuai paket yang dipilih.</li>
          <li>Pelanggan membayar tagihan bulanan sebelum tanggal jatuh tempo.</li>
          <li>Keterlambatan pembayaran dapat mengakibatkan isolir layanan.</li>
          <li>Perangkat (ONU/router) yang dipinjamkan tetap milik Penyedia Layanan.</li>
          <li>Data pribadi Pelanggan diproses sesuai UU No. 27/2022 (PDP).</li>
        </ol>
      </section>

      <section className="mt-10 flex items-start justify-between gap-8">
        <div className="text-center text-sm">
          <p>Penyedia Layanan</p>
          <div className="mt-16 border-neutral-400 border-t pt-1">Ashnet</div>
        </div>
        <div className="text-center text-sm">
          {/* e-Meterai placeholder */}
          <div
            className={`mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded border-2 border-dashed text-[10px] ${contract.meterai ? 'border-rose-500 text-rose-600' : 'border-neutral-300 text-neutral-400'}`}
          >
            {contract.meterai ? 'e-Meterai\nRp10.000' : 'Meterai'}
          </div>
          <p>Pelanggan</p>
          <div className="mt-2 border-neutral-400 border-t pt-1">
            {contract.signedAt ? `${contract.customerName} ✓` : contract.customerName}
          </div>
        </div>
      </section>

      <footer className="mt-10 text-center text-neutral-400 text-xs">
        {contract.signedAt
          ? `Ditandatangani secara elektronik pada ${formatDate(contract.signedAt)}.`
          : 'Dokumen menunggu tanda tangan elektronik.'}
      </footer>
    </article>
  )
}

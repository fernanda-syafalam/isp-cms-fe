import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon, PrinterIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PrintableInvoice } from '@/features/invoices/components/PrintableInvoice'

import { usePortalMe } from '../hooks/usePortal'

type Props = {
  invoiceId: string
}

// Customer-facing print preview. Reads the invoice from the cached portal/me
// snapshot (no extra backend call) and prints a FAKTUR (unpaid) or KWITANSI
// (paid). Full-viewport white surface; @media print (globals.css) narrows the
// output to #print-document.
export function PortalInvoicePrintPage({ invoiceId }: Props) {
  const { data, isLoading, isError } = usePortalMe()
  const invoice = data?.invoices.find((inv) => inv.id === invoiceId)

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-neutral-100 print:static print:overflow-visible print:bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between border-neutral-200 border-b bg-white px-4 py-3 print:hidden">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/portal">
            <ArrowLeftIcon className="size-4" />
            Kembali
          </Link>
        </Button>
        <Button size="sm" disabled={!invoice} onClick={() => window.print()}>
          <PrinterIcon className="size-4" />
          Unduh / Cetak
        </Button>
      </div>

      <div className="mx-auto my-6 max-w-[800px] bg-white shadow-lg print:my-0 print:shadow-none">
        {isLoading ? (
          <div className="space-y-4 px-10 py-12">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : isError || !invoice ? (
          <p className="px-10 py-12 text-destructive" role="alert">
            Tagihan tidak ditemukan.
          </p>
        ) : (
          <div id="print-document">
            <PrintableInvoice invoice={invoice} />
          </div>
        )}
      </div>
    </div>
  )
}

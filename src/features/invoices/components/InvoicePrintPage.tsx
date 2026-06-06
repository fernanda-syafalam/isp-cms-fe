import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon, PrinterIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSettings } from '@/features/settings'

import { useInvoice } from '../hooks/useInvoices'
import { PrintableInvoice } from './PrintableInvoice'

type Props = {
  invoiceId: string
}

// Focused print preview: a full-viewport white surface that covers the app
// shell on screen; @media print (globals.css) then prints only #print-document.
export function InvoicePrintPage({ invoiceId }: Props) {
  const { data: invoice, isLoading, isError } = useInvoice(invoiceId)
  const { data: settings } = useSettings()

  const issuer = settings
    ? {
        name: settings.company.name,
        address: settings.company.address,
        phone: settings.company.phone,
        email: settings.company.email,
        // Only attach NPWP when PKP (omit the key entirely otherwise).
        ...(settings.tax.pkp ? { npwp: settings.tax.npwp } : {}),
      }
    : undefined

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-neutral-100 print:static print:overflow-visible print:bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between border-neutral-200 border-b bg-white px-4 py-3 print:hidden">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/invoices/$invoiceId" params={{ invoiceId }}>
            <ArrowLeftIcon className="size-4" />
            Kembali
          </Link>
        </Button>
        <Button size="sm" disabled={!invoice} onClick={() => window.print()}>
          <PrinterIcon className="size-4" />
          Cetak / Simpan PDF
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
            <PrintableInvoice invoice={invoice} issuer={issuer} />
          </div>
        )}
      </div>
    </div>
  )
}

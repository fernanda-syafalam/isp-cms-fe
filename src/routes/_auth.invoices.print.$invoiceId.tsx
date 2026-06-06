import { createFileRoute } from '@tanstack/react-router'

import { InvoicePrintPage } from '@/features/invoices'

export const Route = createFileRoute('/_auth/invoices/print/$invoiceId')({
  component: InvoicePrintRoute,
})

function InvoicePrintRoute() {
  const { invoiceId } = Route.useParams()
  return <InvoicePrintPage invoiceId={invoiceId} />
}

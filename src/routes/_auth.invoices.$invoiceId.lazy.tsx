import { createLazyFileRoute } from '@tanstack/react-router'

import { InvoiceDetailPage } from '@/features/invoices'

export const Route = createLazyFileRoute('/_auth/invoices/$invoiceId')({
  component: InvoiceDetailRoute,
})

function InvoiceDetailRoute() {
  const { invoiceId } = Route.useParams()
  return <InvoiceDetailPage invoiceId={invoiceId} />
}

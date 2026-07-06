import { createFileRoute } from '@tanstack/react-router'

import { PortalInvoicePrintPage } from '@/features/portal'

export const Route = createFileRoute('/_auth/portal/invoices/$invoiceId/print')({
  component: PortalInvoicePrintRoute,
})

function PortalInvoicePrintRoute() {
  const { invoiceId } = Route.useParams()
  return <PortalInvoicePrintPage invoiceId={invoiceId} />
}

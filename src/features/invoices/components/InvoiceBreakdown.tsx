import { DetailSection } from '@/components/shared/detail-sheet'
import type { Invoice } from '@/schemas/invoice'

import { InvoiceBreakdownLines } from './InvoiceBreakdownLines'

// "Rincian" amount breakdown for the invoice quick-view drawer. Delegates the
// money lines to the shared InvoiceBreakdownLines (single source of truth); the
// drawer only supplies the labelled section wrapper.
export function InvoiceBreakdown({ invoice }: { invoice: Invoice }) {
  return (
    <DetailSection title="Rincian">
      <InvoiceBreakdownLines invoice={invoice} />
    </DetailSection>
  )
}

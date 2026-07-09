import { StatusBadge } from '@/components/shared/status-badge'
import type { InvoiceType } from '@/schemas/invoice'

type Props = {
  type: InvoiceType
}

// Marks a proration / SLA-credit correction row so staff can tell it apart from
// a regular monthly invoice. Renders nothing for a `regular` invoice.
export function InvoiceTypeBadge({ type }: Props) {
  if (type !== 'adjustment') return null
  return <StatusBadge tone="info" label="Penyesuaian" dot={false} />
}

import { createFileRoute } from '@tanstack/react-router'

// Route stub only — component is code-split into _auth.payments.lazy.tsx.
// Keeps the payment-method filter (?method=) and the active view (?view=) in the
// URL so both survive a refresh / deep-link.
type PaymentsSearch = {
  method?: string
  view?: 'reconciliation'
}

export const Route = createFileRoute('/_auth/payments')({
  validateSearch: (search: Record<string, unknown>): PaymentsSearch => {
    const out: PaymentsSearch = {}
    if (typeof search.method === 'string') out.method = search.method
    if (search.view === 'reconciliation') out.view = 'reconciliation'
    return out
  },
})

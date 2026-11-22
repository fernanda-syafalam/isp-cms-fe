import { createFileRoute } from '@tanstack/react-router'

// Route stub only — component is code-split into _auth.payments.lazy.tsx.
// Keeps the payment-method filter (?method=) in the
// URL so it survives a refresh / deep-link.
type PaymentsSearch = {
  method?: string
}

export const Route = createFileRoute('/_auth/payments')({
  validateSearch: (search: Record<string, unknown>): PaymentsSearch => {
    const out: PaymentsSearch = {}
    if (typeof search.method === 'string') out.method = search.method
    return out
  },
})

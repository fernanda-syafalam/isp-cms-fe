import { createFileRoute } from '@tanstack/react-router'

// Route stub only — component is code-split into _auth.payments.lazy.tsx.
// Keeps the payment-method filter (?method=) in the URL so it survives refresh.
export const Route = createFileRoute('/_auth/payments')({
  validateSearch: (search: Record<string, unknown>): { method?: string } =>
    typeof search.method === 'string' ? { method: search.method } : {},
})

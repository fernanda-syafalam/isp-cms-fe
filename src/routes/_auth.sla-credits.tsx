import { createFileRoute } from '@tanstack/react-router'

// Optional prefill params so other modules (e.g. a breached ticket) can
// deep-link "terbitkan kredit SLA" with the customer + ticket pre-filled.
function prefillSearch(search: Record<string, unknown>): {
  customer?: string
  ticket?: string
} {
  const out: { customer?: string; ticket?: string } = {}
  if (typeof search.customer === 'string') out.customer = search.customer
  if (typeof search.ticket === 'string') out.ticket = search.ticket
  return out
}

// Route stub only — component is code-split into _auth.sla-credits.lazy.tsx.
export const Route = createFileRoute('/_auth/sla-credits')({
  validateSearch: prefillSearch,
})

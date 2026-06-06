import { createFileRoute } from '@tanstack/react-router'

// Route stub only — component (incl. Leaflet map picker) is code-split into
// _auth.customers.onboarding.lazy.tsx to keep it out of the main bundle.
export const Route = createFileRoute('/_auth/customers/onboarding')({})

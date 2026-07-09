import { createFileRoute } from '@tanstack/react-router'

// Route stub only — component is code-split into _auth.customers.$customerId.lazy.tsx.
export const Route = createFileRoute('/_auth/customers/$customerId')({})

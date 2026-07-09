import { createFileRoute } from '@tanstack/react-router'

// Route stub only — component is code-split into
// _auth.resellers.$resellerId.customers.$customerId.lazy.tsx.
export const Route = createFileRoute('/_auth/resellers/$resellerId/customers/$customerId')({})

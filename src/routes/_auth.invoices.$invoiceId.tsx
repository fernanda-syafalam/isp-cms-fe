import { createFileRoute } from '@tanstack/react-router'

// Route stub only — component is code-split into _auth.invoices.$invoiceId.lazy.tsx.
export const Route = createFileRoute('/_auth/invoices/$invoiceId')({})

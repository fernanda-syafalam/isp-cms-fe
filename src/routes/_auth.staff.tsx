import { createFileRoute } from '@tanstack/react-router'

// Route definition only — the component lives in _auth.staff.lazy.tsx so it is
// fetched on demand.
export const Route = createFileRoute('/_auth/staff')({})

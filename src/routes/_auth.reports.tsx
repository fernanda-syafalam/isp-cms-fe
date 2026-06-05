import { createFileRoute } from '@tanstack/react-router'

// Route definition only — the component (and its recharts dependency) lives in
// _auth.reports.lazy.tsx so charts are code-split out of the critical-path bundle.
export const Route = createFileRoute('/_auth/reports')({})

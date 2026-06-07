import { createFileRoute } from '@tanstack/react-router'

// Route stub (keeps validateSearch) — component is code-split into the lazy file.
// Keeps both the status and the work-order type filter in the URL.
export const Route = createFileRoute('/_auth/work-orders')({
  validateSearch: (search: Record<string, unknown>): { status?: string; type?: string } => ({
    ...(typeof search.status === 'string' ? { status: search.status } : {}),
    ...(typeof search.type === 'string' ? { type: search.type } : {}),
  }),
})

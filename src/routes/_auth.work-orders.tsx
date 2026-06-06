import { createFileRoute } from '@tanstack/react-router'

import { statusSearch } from '@/lib/search'

// Route stub (keeps validateSearch) — component is code-split into the lazy file.
export const Route = createFileRoute('/_auth/work-orders')({
  validateSearch: statusSearch,
})

import { createFileRoute } from '@tanstack/react-router'

import { statusSearch } from '@/lib/search'

// Route stub only — component is code-split into _auth.plans.lazy.tsx.
export const Route = createFileRoute('/_auth/plans')({
  validateSearch: statusSearch,
})

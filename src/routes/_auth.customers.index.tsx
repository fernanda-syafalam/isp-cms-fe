import { createFileRoute } from '@tanstack/react-router'

import { statusSearch } from '@/lib/search'

// Route stub — component is code-split into _auth.customers.index.lazy.tsx.
export const Route = createFileRoute('/_auth/customers/')({
  validateSearch: statusSearch,
})

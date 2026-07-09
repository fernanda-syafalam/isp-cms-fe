import { createFileRoute } from '@tanstack/react-router'

import { statusSearch } from '@/lib/search'

// Route stub — component is code-split into _auth.network.routers.index.lazy.tsx.
export const Route = createFileRoute('/_auth/network/routers/')({
  validateSearch: statusSearch,
})

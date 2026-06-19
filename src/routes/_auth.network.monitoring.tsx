import { createFileRoute } from '@tanstack/react-router'

import { statusSearch } from '@/lib/search'

// Route stub only — component is code-split into _auth.network.monitoring.lazy.tsx.
export const Route = createFileRoute('/_auth/network/monitoring')({
  validateSearch: statusSearch,
})

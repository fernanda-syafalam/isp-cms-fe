import { createFileRoute } from '@tanstack/react-router'

import { statusSearch } from '@/lib/search'

// Route stub — component is code-split into _auth.network.devices.index.lazy.tsx.
export const Route = createFileRoute('/_auth/network/devices/')({
  validateSearch: statusSearch,
})

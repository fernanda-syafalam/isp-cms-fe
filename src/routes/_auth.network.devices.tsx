import { createFileRoute } from '@tanstack/react-router'

import { DevicesListPage } from '@/features/devices'
import { statusSearch } from '@/lib/search'

export const Route = createFileRoute('/_auth/network/devices')({
  component: DevicesListPage,
  validateSearch: statusSearch,
})

import { createFileRoute } from '@tanstack/react-router'

import { WorkOrdersListPage } from '@/features/work-orders'
import { statusSearch } from '@/lib/search'

export const Route = createFileRoute('/_auth/work-orders')({
  component: WorkOrdersListPage,
  validateSearch: statusSearch,
})

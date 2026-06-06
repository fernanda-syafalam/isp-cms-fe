import { createLazyFileRoute } from '@tanstack/react-router'

import { WorkOrdersListPage } from '@/features/work-orders'

export const Route = createLazyFileRoute('/_auth/work-orders')({
  component: WorkOrdersListPage,
})

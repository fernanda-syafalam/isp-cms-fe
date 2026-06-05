import { createFileRoute } from '@tanstack/react-router'

import { WorkOrdersListPage } from '@/features/work-orders'

export const Route = createFileRoute('/_auth/work-orders')({
  component: WorkOrdersListPage,
})

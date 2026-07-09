import { createLazyFileRoute } from '@tanstack/react-router'

import { InventoryListPage } from '@/features/inventory'

export const Route = createLazyFileRoute('/_auth/inventory/')({
  component: InventoryListPage,
})

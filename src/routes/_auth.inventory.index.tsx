import { createFileRoute } from '@tanstack/react-router'

import { InventoryListPage } from '@/features/inventory'

export const Route = createFileRoute('/_auth/inventory/')({
  component: InventoryListPage,
})

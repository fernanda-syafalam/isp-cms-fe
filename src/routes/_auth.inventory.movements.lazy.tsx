import { createLazyFileRoute } from '@tanstack/react-router'

import { StockMovementsPage } from '@/features/inventory'

export const Route = createLazyFileRoute('/_auth/inventory/movements')({
  component: StockMovementsPage,
})

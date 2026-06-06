import { createFileRoute } from '@tanstack/react-router'

import { StockMovementsPage } from '@/features/inventory'

export const Route = createFileRoute('/_auth/inventory/movements')({
  component: StockMovementsPage,
})

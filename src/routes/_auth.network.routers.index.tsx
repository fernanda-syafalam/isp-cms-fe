import { createFileRoute } from '@tanstack/react-router'

import { RoutersListPage } from '@/features/routers'

export const Route = createFileRoute('/_auth/network/routers/')({
  component: RoutersListPage,
})

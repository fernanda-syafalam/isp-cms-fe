import { createLazyFileRoute } from '@tanstack/react-router'

import { RoutersListPage } from '@/features/routers'

export const Route = createLazyFileRoute('/_auth/network/routers/')({
  component: RoutersListPage,
})

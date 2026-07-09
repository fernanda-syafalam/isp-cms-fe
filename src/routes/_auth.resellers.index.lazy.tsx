import { createLazyFileRoute } from '@tanstack/react-router'

import { ResellersListPage } from '@/features/resellers'

export const Route = createLazyFileRoute('/_auth/resellers/')({
  component: ResellersListPage,
})

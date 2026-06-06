import { createFileRoute } from '@tanstack/react-router'

import { ResellersListPage } from '@/features/resellers'

export const Route = createFileRoute('/_auth/resellers/')({
  component: ResellersListPage,
})

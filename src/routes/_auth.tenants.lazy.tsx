import { createLazyFileRoute } from '@tanstack/react-router'

import { TenantsListPage } from '@/features/tenants'

export const Route = createLazyFileRoute('/_auth/tenants')({
  component: TenantsRoute,
})

function TenantsRoute() {
  return <TenantsListPage />
}

import { createFileRoute } from '@tanstack/react-router'

import { TenantsListPage } from '@/features/tenants'

export const Route = createFileRoute('/tenants')({
  component: TenantsRoute,
})

function TenantsRoute() {
  return <TenantsListPage />
}

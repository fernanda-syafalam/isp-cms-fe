import { createLazyFileRoute } from '@tanstack/react-router'

import { UsersListPage } from '@/features/users'

export const Route = createLazyFileRoute('/_auth/staff')({
  component: UsersRoute,
})

function UsersRoute() {
  return <UsersListPage />
}

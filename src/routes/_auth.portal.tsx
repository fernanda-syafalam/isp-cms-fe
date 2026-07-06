import { Outlet, createFileRoute } from '@tanstack/react-router'

// Layout route for the customer portal — renders its child routes (the
// dashboard index and the invoice print page) via <Outlet />.
export const Route = createFileRoute('/_auth/portal')({
  component: Outlet,
})

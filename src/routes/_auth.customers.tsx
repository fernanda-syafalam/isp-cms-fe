import { Outlet, createFileRoute } from '@tanstack/react-router'

// Layout for the customers section so the list (index) and detail ($customerId)
// routes nest under /customers.
export const Route = createFileRoute('/_auth/customers')({
  component: Outlet,
})

import { Outlet, createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_auth/invoices')({
  component: Outlet,
})

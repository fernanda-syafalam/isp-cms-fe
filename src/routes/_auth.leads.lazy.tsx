import { createLazyFileRoute } from '@tanstack/react-router'

import { LeadsPage } from '@/features/leads'

export const Route = createLazyFileRoute('/_auth/leads')({
  component: LeadsPage,
})

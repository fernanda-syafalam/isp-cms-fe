import { createLazyFileRoute } from '@tanstack/react-router'

import { SettingsPage } from '@/features/settings'

export const Route = createLazyFileRoute('/_auth/settings')({
  component: SettingsPage,
})

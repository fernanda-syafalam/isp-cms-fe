import { createLazyFileRoute } from '@tanstack/react-router'

import { NotificationsPage } from '@/features/notifications'

export const Route = createLazyFileRoute('/_auth/notifications')({
  component: NotificationsPage,
})

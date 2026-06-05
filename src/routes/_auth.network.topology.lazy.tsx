import { createLazyFileRoute } from '@tanstack/react-router'

import { NetworkTopologyPage } from '@/features/topology'

export const Route = createLazyFileRoute('/_auth/network/topology')({
  component: NetworkTopologyPage,
})

import { useQuery } from '@tanstack/react-query'

import { listPlans } from '@/api/plans'

// Cross-feature hook: plan options for selects (e.g. the customer form).
// Lives in hooks/ rather than features/plans so other features can consume it
// without a feature-to-feature import (see CLAUDE.md layering).
export function usePlanOptions() {
  return useQuery({
    queryKey: ['plans', 'options'] as const,
    queryFn: () => listPlans(),
    select: (data) =>
      data.items
        .filter((plan) => plan.status === 'active')
        .map((plan) => ({
          value: plan.id,
          label: `${plan.name} · ${plan.speedMbps} Mbps`,
        })),
    staleTime: 5 * 60_000,
  })
}

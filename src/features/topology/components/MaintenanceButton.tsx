import { WrenchIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { NetworkNode } from '@/schemas/topology'

import { useUpdateNode } from '../hooks/useTopology'

type Props = {
  node: NetworkNode
}

// One-click planned-work toggle for the selected node. Marking maintenance keeps
// the node off the fault diagnosis (planned work ≠ outage) and paints it sky on
// the map. Self-contained mutation so the detail panel stays presentational.
export function MaintenanceButton({ node }: Props) {
  const update = useUpdateNode()
  const on = node.meta?.maintenance === true
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 w-full"
      disabled={update.isPending}
      onClick={() => update.mutate({ id: node.id, input: { maintenance: !on } })}
    >
      <WrenchIcon className="size-4" />
      {on ? 'Akhiri pemeliharaan' : 'Tandai pemeliharaan'}
    </Button>
  )
}

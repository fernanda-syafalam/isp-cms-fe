import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import type { NetworkNode } from '@/schemas/topology'

import type { ProbableFault } from '../lib/faults'
import { useSplitters } from '../hooks/useCabling'
import { FaultDiagnosis } from './FaultDiagnosis'
import { FiberReference } from './FiberReference'
import { NodeDetailPanel } from './NodeDetailPanel'
import { SplitterPorts } from './SplitterPorts'
import { TopologyLegend } from './TopologyLegend'

type Props = {
  selected: NetworkNode | null
  byId: Map<string, NetworkNode>
  nodes: NetworkNode[]
  editMode: boolean
  distanceMeters?: number | undefined
  nearestOdp: { node: NetworkNode; meters: number } | null
  faults: ProbableFault[]
  onClear: () => void
  onEdit: () => void
  onDelete: () => void
  onPickNearest: (node: NetworkNode) => void
  onSelectFault: (id: string) => void
}

// The right-hand region. On desktop it's the side column (node detail, or the
// legend when nothing is selected). On mobile (where there is no room for a
// column) the legend + fiber reference stack below the map and the node detail
// slides up in a bottom Sheet on selection — thumb-reachable in the field. One
// NodeDetailPanel instance is reused across both layouts.
export function TopologyAside({
  selected,
  byId,
  nodes,
  editMode,
  distanceMeters,
  nearestOdp,
  faults,
  onClear,
  onEdit,
  onDelete,
  onPickNearest,
  onSelectFault,
}: Props) {
  const isMobile = useIsMobile()
  const legend = <TopologyLegend nearestOdp={nearestOdp} onPickNearest={onPickNearest} />
  // Probable outage roots stay visible above everything else — even with a node
  // selected — so an active fault is never out of sight in the field.
  const faultCard = <FaultDiagnosis faults={faults} onSelect={onSelectFault} />
  // An ODC/ODP carries a splitter; show its per-port occupancy beside the panel.
  const splitters = useSplitters().data?.items
  const splitter =
    selected && (selected.type === 'odc' || selected.type === 'odp')
      ? splitters?.find((s) => s.nodeId === selected.id)
      : undefined
  const splitterCard = splitter ? <SplitterPorts splitter={splitter} byId={byId} /> : null

  if (isMobile) {
    return (
      <>
        {faultCard}
        {legend}
        <FiberReference />
        <Sheet open={selected !== null} onOpenChange={(open) => !open && onClear()}>
          <SheetContent side="bottom" className="max-h-[85dvh] gap-0 overflow-y-auto p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Detail node</SheetTitle>
              <SheetDescription>Detail teknis node jaringan yang dipilih.</SheetDescription>
            </SheetHeader>
            {selected ? (
              <NodeDetailPanel
                node={selected}
                byId={byId}
                nodes={nodes}
                editMode={editMode}
                distanceMeters={distanceMeters}
                showClose={false}
                onClear={onClear}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ) : null}
            {selected ? <div className="px-0 pb-4">{splitterCard}</div> : null}
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <>
      {faultCard}
      {selected ? (
        <NodeDetailPanel
          node={selected}
          byId={byId}
          nodes={nodes}
          editMode={editMode}
          distanceMeters={distanceMeters}
          onClear={onClear}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : (
        legend
      )}
      {selected ? splitterCard : null}
      <FiberReference />
    </>
  )
}
